import { Context } from 'telegraf';
import { BackendApiService } from '../services/backend-api.service';
import { ActionsRendererService } from '../services/actions-renderer.service';
import { config } from '../config';

const backendApi = new BackendApiService();
const actionsRenderer = new ActionsRendererService();

// Store active test attempts per user
const activeAttempts = new Map<string, string>();

export async function startTestHandler(ctx: Context): Promise<void> {
  const userId = ctx.from!.id.toString();
  const projectId = config.defaultProjectId;

  if (!projectId) {
    await ctx.reply('Проект не настроен.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const response = await backendApi.startTest({ projectId, userId });

    // Store attempt ID for this user
    activeAttempts.set(userId, response.attemptId);

    await actionsRenderer.render(ctx, response.actions);
  } catch (error: any) {
    const message =
      error?.response?.data?.message || 'Ошибка при запуске теста.';
    await ctx.reply(message);
  }
}

/**
 * Parse test answers from user message.
 * Expected format: "1: answer\n2: answer"
 */
export function parseTestAnswers(
  text: string,
): Record<string, string> | null {
  const lines = text.split('\n').filter((l) => l.trim());
  const answers: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^(\d+)\s*[:.)]\s*(.+)$/);
    if (match) {
      answers[match[1]] = match[2].trim();
    }
  }

  return Object.keys(answers).length > 0 ? answers : null;
}

export async function submitTestHandler(
  ctx: Context,
  answersText: string,
): Promise<void> {
  const userId = ctx.from!.id.toString();
  const attemptId = activeAttempts.get(userId);

  if (!attemptId) {
    await ctx.reply('У вас нет активного теста. Нажмите "Пройти тест".');
    return;
  }

  const answers = parseTestAnswers(answersText);
  if (!answers) {
    await ctx.reply(
      'Не удалось распознать ответы.\n' +
        'Формат: `1: ответ\\n2: ответ`',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const response = await backendApi.submitTest({ attemptId, answers });

    // Clear active attempt
    activeAttempts.delete(userId);

    await actionsRenderer.render(ctx, response.actions);
  } catch (error: any) {
    const message =
      error?.response?.data?.message || 'Ошибка при проверке теста.';
    await ctx.reply(message);
  }
}

export function hasActiveAttempt(userId: string): boolean {
  return activeAttempts.has(userId);
}
