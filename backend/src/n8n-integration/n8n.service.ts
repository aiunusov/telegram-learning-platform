import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /** Get due reminders for students and admins. */
  async getDueReminders() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Students who haven't been active in 1 day
    const inactiveSessions = await this.prisma.learningSession.findMany({
      where: {
        lastActivityAt: { lt: oneDayAgo },
        state: { not: 'COMPLETED' },
      },
      include: {
        user: { select: { telegramId: true, firstName: true } },
        project: { select: { name: true } },
      },
    });

    const studentReminders = inactiveSessions.map((s) => ({
      telegramId: s.user.telegramId,
      studentName: s.user.firstName,
      projectName: s.project.name,
      lastActivity: s.lastActivityAt,
      message: `Привет, ${s.user.firstName || 'студент'}! Ты давно не заходил(а) в "${s.project.name}". Продолжи обучение!`,
    }));

    // Homework submissions pending review > 3 days
    const pendingHomework = await this.prisma.homeworkSubmission.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { lt: threeDaysAgo },
      },
      include: {
        user: { select: { firstName: true, username: true } },
        project: {
          select: {
            name: true,
            owner: { select: { telegramId: true, firstName: true } },
          },
        },
      },
    });

    const adminReminders = pendingHomework.map((h) => ({
      telegramId: h.project.owner.telegramId,
      adminName: h.project.owner.firstName,
      studentName: h.user.firstName || h.user.username,
      projectName: h.project.name,
      submittedAt: h.submittedAt,
      message: `У вас есть непроверенная домашка от ${h.user.firstName || 'студента'} в проекте "${h.project.name}"`,
    }));

    return { studentReminders, adminReminders };
  }

  /** Recompute metrics via n8n trigger. */
  async recomputeMetrics(projectId?: string, dateStr?: string) {
    let processed = 0;

    if (projectId) {
      processed = await this.analyticsService.recomputeMetrics(
        projectId,
        dateStr,
      );
    } else {
      // Recompute for all projects
      const projects = await this.prisma.project.findMany({
        select: { id: true },
      });
      for (const project of projects) {
        processed += await this.analyticsService.recomputeMetrics(
          project.id,
          dateStr,
        );
      }
    }

    return { processed };
  }

  /** Recompute leaderboard via n8n trigger. */
  async recomputeLeaderboard(
    projectId?: string,
    period: 'week' | 'month' = 'week',
  ) {
    if (projectId) {
      const snapshot = await this.analyticsService.cacheLeaderboard(
        projectId,
        period,
      );
      return { snapshotId: snapshot.id };
    }

    // Recompute for all projects
    const projects = await this.prisma.project.findMany({
      select: { id: true },
    });

    let lastSnapshotId = '';
    for (const project of projects) {
      const snapshot = await this.analyticsService.cacheLeaderboard(
        project.id,
        period,
      );
      lastSnapshotId = snapshot.id;
    }

    return { snapshotId: lastSnapshotId };
  }
}
