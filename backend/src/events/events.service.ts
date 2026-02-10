import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EventPayload {
  projectId: string;
  userId: string;
  sessionId?: string;
  type: string;
  payload?: Record<string, any>;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Log an event to the events table. */
  async emit(event: EventPayload) {
    this.logger.debug(`Event: ${event.type} [project=${event.projectId}]`);

    return this.prisma.event.create({
      data: {
        projectId: event.projectId,
        userId: event.userId,
        sessionId: event.sessionId,
        type: event.type,
        payload: event.payload || {},
      },
    });
  }

  /** Get events for a project with optional filters. */
  async findByProject(
    projectId: string,
    options?: { type?: string; limit?: number; offset?: number },
  ) {
    return this.prisma.event.findMany({
      where: {
        projectId,
        ...(options?.type ? { type: options.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /** Get events for a session. */
  async findBySession(sessionId: string) {
    return this.prisma.event.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
