import { Injectable, Logger } from '@nestjs/common';
import { EventsService, EventPayload } from './events.service';

type EventHandler = (event: EventPayload) => Promise<void>;

@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger(EventDispatcherService.name);
  private handlers = new Map<string, EventHandler[]>();

  constructor(private readonly eventsService: EventsService) {}

  /** Register a handler for an event type. */
  on(eventType: string, handler: EventHandler) {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  /** Emit and persist an event, then notify all handlers. */
  async dispatch(event: EventPayload) {
    // Persist event
    await this.eventsService.emit(event);

    // Notify handlers
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(
          `Handler error for event ${event.type}: ${error}`,
        );
      }
    }
  }
}
