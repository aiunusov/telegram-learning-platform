import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StateMachineService } from './state-machine.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { LearningState, BotAction } from '../common/contracts';

@Injectable()
export class RuntimeService {
  private readonly logger = new Logger(RuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: StateMachineService,
    private readonly eventDispatcher: EventDispatcherService,
    private readonly aiCore: AiCoreService,
  ) {}

  /** Get or create a learning session for user+project. */
  async getOrCreateSession(projectId: string, userId: string) {
    let session = await this.prisma.learningSession.findFirst({
      where: { projectId, userId },
      orderBy: { lastActivityAt: 'desc' },
    });

    if (!session) {
      session = await this.prisma.learningSession.create({
        data: { projectId, userId, state: 'IDLE' },
      });
    }

    return session;
  }

  /** Process a user message through the runtime pipeline. */
  async processMessage(params: {
    projectId: string;
    userId: string;
    message: string;
    attachments?: any[];
  }): Promise<{ actions: BotAction[]; sessionState?: LearningState }> {
    const session = await this.getOrCreateSession(
      params.projectId,
      params.userId,
    );
    const currentState = session.state as LearningState;
    const actions: BotAction[] = [];

    // Route based on current state
    switch (currentState) {
      case LearningState.IDLE: {
        // Transition to LEARNING
        const newState = this.stateMachine.transition(
          currentState,
          'user_starts_learning',
        );
        await this.updateSessionState(session.id, newState);
        await this.eventDispatcher.dispatch({
          projectId: params.projectId,
          userId: params.userId,
          sessionId: session.id,
          type: 'user_starts_learning',
          payload: { message: params.message },
        });

        // Get AI answer via RAG
        const result = await this.aiCore.answer({
          projectId: params.projectId,
          userId: params.userId,
          query: params.message,
        });

        actions.push({
          type: 'send_message',
          text: result.answer,
          parse_mode: 'Markdown',
        });

        actions.push({
          type: 'show_buttons',
          text: 'Что дальше?',
          buttons: [
            { text: '❓ Ещё вопрос', payload: 'action:continue_learning' },
            { text: '✅ Пройти тест', payload: 'action:start_test' },
            { text: '📝 Домашка', payload: 'action:submit_homework' },
          ],
          inline: true,
        });

        return { actions, sessionState: newState };
      }

      case LearningState.LEARNING: {
        // Stay in LEARNING, process question
        this.stateMachine.transition(currentState, 'user_asks_question');
        await this.eventDispatcher.dispatch({
          projectId: params.projectId,
          userId: params.userId,
          sessionId: session.id,
          type: 'user_asks_question',
          payload: { message: params.message },
        });

        await this.updateSessionActivity(session.id);

        const result = await this.aiCore.answer({
          projectId: params.projectId,
          userId: params.userId,
          query: params.message,
        });

        actions.push({
          type: 'send_message',
          text: result.answer,
          parse_mode: 'Markdown',
        });

        actions.push({
          type: 'show_buttons',
          buttons: [
            { text: '❓ Ещё вопрос', payload: 'action:continue_learning' },
            { text: '✅ Пройти тест', payload: 'action:start_test' },
          ],
          inline: true,
        });

        return { actions, sessionState: LearningState.LEARNING };
      }

      case LearningState.TESTING: {
        // User is in a test, treat message as answer submission note
        actions.push({
          type: 'send_message',
          text: 'Вы сейчас проходите тест. Пожалуйста, ответьте на вопросы или нажмите "Завершить".',
        });
        return { actions, sessionState: currentState };
      }

      case LearningState.REVIEWING: {
        // Post-test review: allow asking more questions or starting new test
        const newState = this.stateMachine.transition(
          currentState,
          'user_starts_test',
        );
        // Actually go back to learning first
        await this.updateSessionState(session.id, LearningState.IDLE);

        const result = await this.aiCore.answer({
          projectId: params.projectId,
          userId: params.userId,
          query: params.message,
        });

        actions.push({
          type: 'send_message',
          text: result.answer,
          parse_mode: 'Markdown',
        });

        return { actions, sessionState: LearningState.IDLE };
      }

      default: {
        actions.push({
          type: 'send_message',
          text: 'Используйте /start чтобы начать.',
        });
        return { actions, sessionState: currentState };
      }
    }
  }

  /** Start a test session. */
  async startTest(params: {
    projectId: string;
    userId: string;
    testId?: string;
  }): Promise<{ actions: BotAction[]; attemptId: string }> {
    const session = await this.getOrCreateSession(
      params.projectId,
      params.userId,
    );
    const currentState = session.state as LearningState;

    const newState = this.stateMachine.transition(
      currentState,
      'user_starts_test',
    );

    // Find a published test
    let test;
    if (params.testId) {
      test = await this.prisma.test.findFirst({
        where: { id: params.testId, projectId: params.projectId, status: 'PUBLISHED' },
      });
    } else {
      test = await this.prisma.test.findFirst({
        where: { projectId: params.projectId, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!test) {
      throw new NotFoundException('No published tests available');
    }

    // Create attempt
    const attempt = await this.prisma.testAttempt.create({
      data: {
        projectId: params.projectId,
        userId: params.userId,
        testId: test.id,
        status: 'STARTED',
      },
    });

    // Update session
    await this.prisma.learningSession.update({
      where: { id: session.id },
      data: {
        state: newState,
        currentTestId: test.id,
        lastActivityAt: new Date(),
      },
    });

    await this.eventDispatcher.dispatch({
      projectId: params.projectId,
      userId: params.userId,
      sessionId: session.id,
      type: 'user_starts_test',
      payload: { testId: test.id, attemptId: attempt.id },
    });

    const actions: BotAction[] = [
      {
        type: 'show_test',
        testId: test.id,
        spec: test.spec,
      },
    ];

    return { actions, attemptId: attempt.id };
  }

  /** Submit test answers and get AI-checked results. */
  async submitTest(params: {
    attemptId: string;
    answers: Record<string, any>;
  }): Promise<{ actions: BotAction[]; checkResult: any }> {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: { test: true },
    });

    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }

    const session = await this.getOrCreateSession(
      attempt.projectId,
      attempt.userId,
    );

    // Transition: TESTING → SUBMITTING
    const submittingState = this.stateMachine.transition(
      session.state as LearningState,
      'user_submits_answers',
    );
    await this.updateSessionState(session.id, submittingState);

    // Save submission
    const submission = await this.prisma.testSubmission.create({
      data: {
        attemptId: attempt.id,
        answers: params.answers,
      },
    });

    // Update attempt
    await this.prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { status: 'SUBMITTED', finishedAt: new Date() },
    });

    // AI check
    const checkResult = await this.aiCore.checkAnswers({
      spec: attempt.test.spec as any,
      answers: params.answers,
    });

    // Save check
    await this.prisma.testCheck.create({
      data: {
        submissionId: submission.id,
        score: checkResult.score,
        passed: checkResult.passed,
        mistakes: checkResult.mistakes as any,
        feedback: checkResult.feedback,
        recommendation: checkResult.recommendation,
      },
    });

    // Update attempt status
    await this.prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { status: 'CHECKED' },
    });

    // Transition: SUBMITTING → REVIEWING
    const reviewingState = this.stateMachine.transition(
      submittingState,
      'check_completed',
    );
    await this.updateSessionState(session.id, reviewingState);

    await this.eventDispatcher.dispatch({
      projectId: attempt.projectId,
      userId: attempt.userId,
      sessionId: session.id,
      type: 'check_completed',
      payload: { attemptId: attempt.id, score: checkResult.score },
    });

    const actions: BotAction[] = [
      {
        type: 'send_message',
        text:
          `📊 *Результаты теста*\n\n` +
          `Балл: ${checkResult.score}/100\n` +
          `Статус: ${checkResult.passed ? '✅ Пройден' : '❌ Не пройден'}\n\n` +
          `${checkResult.feedback}`,
        parse_mode: 'Markdown',
      },
    ];

    if (checkResult.mistakes.length > 0) {
      let mistakesText = '🔍 *Ошибки:*\n\n';
      checkResult.mistakes.forEach((m: any, i: number) => {
        mistakesText += `${i + 1}. ${m.explanation}\n`;
      });
      actions.push({
        type: 'send_message',
        text: mistakesText,
        parse_mode: 'Markdown',
      });
    }

    actions.push({
      type: 'show_buttons',
      text: `Рекомендация: ${checkResult.recommendation}`,
      buttons: [
        { text: '🔄 Повторить тест', payload: 'action:start_test' },
        { text: '📚 Продолжить учиться', payload: 'action:continue_learning' },
        { text: '📝 Домашка', payload: 'action:submit_homework' },
      ],
      inline: true,
    });

    return { actions, checkResult };
  }

  /** Get current session state. */
  async getSession(projectId: string, userId: string) {
    const session = await this.getOrCreateSession(projectId, userId);
    return {
      sessionId: session.id,
      state: session.state,
      currentTopic: session.currentTopic,
      currentTestId: session.currentTestId,
      lastActivityAt: session.lastActivityAt,
    };
  }

  private async updateSessionState(sessionId: string, state: LearningState) {
    await this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { state, lastActivityAt: new Date() },
    });
  }

  private async updateSessionActivity(sessionId: string) {
    await this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }
}
