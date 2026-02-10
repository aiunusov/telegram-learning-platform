import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get summary analytics for a project. */
  async getSummary(projectId: string) {
    const [totalUsers, totalTests, totalAttempts, totalHomework, avgScore] =
      await Promise.all([
        this.prisma.projectMember.count({ where: { projectId } }),
        this.prisma.test.count({ where: { projectId } }),
        this.prisma.testAttempt.count({ where: { projectId } }),
        this.prisma.homeworkSubmission.count({ where: { projectId } }),
        this.prisma.testCheck.aggregate({
          _avg: { score: true },
          where: {
            submission: { attempt: { projectId } },
          },
        }),
      ]);

    const publishedTests = await this.prisma.test.count({
      where: { projectId, status: 'PUBLISHED' },
    });

    const passedAttempts = await this.prisma.testCheck.count({
      where: {
        passed: true,
        submission: { attempt: { projectId } },
      },
    });

    return {
      totalUsers,
      totalTests,
      publishedTests,
      totalAttempts,
      passedAttempts,
      passRate: totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 100)
        : 0,
      avgScore: Math.round(avgScore._avg.score || 0),
      totalHomework,
    };
  }

  /** Get leaderboard for a project. */
  async getLeaderboard(projectId: string, period: 'week' | 'month') {
    // Check for cached snapshot
    const snapshot = await this.prisma.leaderboardSnapshot.findFirst({
      where: { projectId, period },
      orderBy: { generatedAt: 'desc' },
    });

    if (snapshot) {
      return { ranking: snapshot.ranking, generatedAt: snapshot.generatedAt };
    }

    // Generate on-the-fly
    const ranking = await this.generateLeaderboard(projectId, period);
    return { ranking, generatedAt: new Date() };
  }

  /** Generate leaderboard data. */
  async generateLeaderboard(projectId: string, period: 'week' | 'month') {
    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get all members' test scores
    const attempts = await this.prisma.testAttempt.findMany({
      where: {
        projectId,
        startedAt: { gte: startDate },
        status: 'CHECKED',
      },
      include: {
        user: { select: { id: true, firstName: true, username: true } },
        submission: { include: { check: true } },
      },
    });

    // Aggregate scores per user
    const userScores = new Map<string, {
      userId: string;
      name: string;
      totalScore: number;
      attempts: number;
      passed: number;
    }>();

    for (const attempt of attempts) {
      const userId = attempt.userId;
      const check = attempt.submission?.check;
      if (!check) continue;

      const existing = userScores.get(userId) || {
        userId,
        name: attempt.user.firstName || attempt.user.username || 'Student',
        totalScore: 0,
        attempts: 0,
        passed: 0,
      };

      existing.totalScore += check.score;
      existing.attempts += 1;
      if (check.passed) existing.passed += 1;

      userScores.set(userId, existing);
    }

    // Sort by total score descending
    const ranking = Array.from(userScores.values())
      .map((u) => ({
        userId: u.userId,
        name: u.name,
        score: u.totalScore,
        attempts: u.attempts,
        passed: u.passed,
        avgScore: u.attempts > 0 ? Math.round(u.totalScore / u.attempts) : 0,
      }))
      .sort((a, b) => b.score - a.score);

    return ranking;
  }

  /** Recompute and cache leaderboard. */
  async cacheLeaderboard(projectId: string, period: 'week' | 'month') {
    const ranking = await this.generateLeaderboard(projectId, period);
    const now = new Date();
    const startDate = new Date(now);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const snapshot = await this.prisma.leaderboardSnapshot.create({
      data: {
        projectId,
        period,
        startDate,
        endDate: now,
        ranking: ranking as any,
      },
    });

    return snapshot;
  }

  /** Recompute daily metrics for a project. */
  async recomputeMetrics(projectId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    let processed = 0;

    for (const member of members) {
      const [questionsAsked, testsCompleted, homeworkSubmitted] = await Promise.all([
        this.prisma.event.count({
          where: {
            projectId,
            userId: member.userId,
            type: 'user_asks_question',
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.testAttempt.count({
          where: {
            projectId,
            userId: member.userId,
            status: 'CHECKED',
            startedAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.homeworkSubmission.count({
          where: {
            projectId,
            userId: member.userId,
            submittedAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
      ]);

      await this.prisma.dailyMetric.upsert({
        where: {
          projectId_userId_date: {
            projectId,
            userId: member.userId,
            date: startOfDay,
          },
        },
        update: {
          metrics: { questionsAsked, testsCompleted, homeworkSubmitted },
        },
        create: {
          projectId,
          userId: member.userId,
          date: startOfDay,
          metrics: { questionsAsked, testsCompleted, homeworkSubmitted },
        },
      });

      processed++;
    }

    return processed;
  }
}
