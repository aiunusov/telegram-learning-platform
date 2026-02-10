import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LearningState } from '../common/contracts';

/** Allowed state transitions. */
const TRANSITIONS: Record<LearningState, LearningState[]> = {
  [LearningState.IDLE]: [
    LearningState.LEARNING,
    LearningState.TESTING,
    LearningState.HOMEWORK_PENDING,
  ],
  [LearningState.LEARNING]: [
    LearningState.LEARNING,
    LearningState.TESTING,
    LearningState.HOMEWORK_PENDING,
    LearningState.IDLE,
  ],
  [LearningState.TESTING]: [LearningState.SUBMITTING],
  [LearningState.SUBMITTING]: [LearningState.REVIEWING],
  [LearningState.REVIEWING]: [
    LearningState.IDLE,
    LearningState.TESTING,
    LearningState.HOMEWORK_PENDING,
    LearningState.COMPLETED,
  ],
  [LearningState.HOMEWORK_PENDING]: [
    LearningState.HOMEWORK_SUBMITTED,
    LearningState.IDLE,
  ],
  [LearningState.HOMEWORK_SUBMITTED]: [
    LearningState.IDLE,
    LearningState.COMPLETED,
  ],
  [LearningState.COMPLETED]: [LearningState.IDLE],
};

/** Events mapped to transitions. */
const EVENT_TRANSITIONS: Record<
  string,
  { from: LearningState | LearningState[]; to: LearningState }
> = {
  user_starts_learning: {
    from: LearningState.IDLE,
    to: LearningState.LEARNING,
  },
  user_asks_question: {
    from: LearningState.LEARNING,
    to: LearningState.LEARNING,
  },
  user_starts_test: {
    from: [LearningState.IDLE, LearningState.LEARNING, LearningState.REVIEWING],
    to: LearningState.TESTING,
  },
  user_submits_answers: {
    from: LearningState.TESTING,
    to: LearningState.SUBMITTING,
  },
  check_completed: {
    from: LearningState.SUBMITTING,
    to: LearningState.REVIEWING,
  },
  user_requests_homework: {
    from: [LearningState.LEARNING, LearningState.REVIEWING],
    to: LearningState.HOMEWORK_PENDING,
  },
  user_submits_homework: {
    from: LearningState.HOMEWORK_PENDING,
    to: LearningState.HOMEWORK_SUBMITTED,
  },
  admin_reviews: {
    from: LearningState.HOMEWORK_SUBMITTED,
    to: LearningState.IDLE,
  },
  user_completes_session: {
    from: [LearningState.REVIEWING, LearningState.HOMEWORK_SUBMITTED],
    to: LearningState.COMPLETED,
  },
};

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  /**
   * Validates and returns the next state for a given event.
   * Throws if the transition is invalid.
   */
  transition(currentState: LearningState, event: string): LearningState {
    const eventDef = EVENT_TRANSITIONS[event];
    if (!eventDef) {
      throw new BadRequestException(`Unknown event: ${event}`);
    }

    const validFrom = Array.isArray(eventDef.from)
      ? eventDef.from
      : [eventDef.from];

    if (!validFrom.includes(currentState)) {
      throw new BadRequestException(
        `Invalid transition: cannot process "${event}" in state "${currentState}". ` +
          `Valid source states: ${validFrom.join(', ')}`,
      );
    }

    const allowedTargets = TRANSITIONS[currentState];
    if (!allowedTargets.includes(eventDef.to)) {
      throw new BadRequestException(
        `Invalid transition: "${currentState}" → "${eventDef.to}" is not allowed`,
      );
    }

    this.logger.debug(
      `State transition: ${currentState} → ${eventDef.to} (event: ${event})`,
    );

    return eventDef.to;
  }

  /** Check if a transition is valid without throwing. */
  canTransition(currentState: LearningState, event: string): boolean {
    try {
      this.transition(currentState, event);
      return true;
    } catch {
      return false;
    }
  }

  /** Get all available events from the current state. */
  getAvailableEvents(currentState: LearningState): string[] {
    return Object.entries(EVENT_TRANSITIONS)
      .filter(([, def]) => {
        const validFrom = Array.isArray(def.from) ? def.from : [def.from];
        return validFrom.includes(currentState);
      })
      .map(([event]) => event);
  }
}
