import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; position?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        onboardingCompleted: true,
      },
    });
  }

  async listAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        position: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: {
          select: {
            projectMemberships: true,
            testAttempts: true,
            homeworkSubmissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignStudentToProject(userId: string, projectId: string) {
    return this.prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: {},
      create: {
        projectId,
        userId,
        role: 'USER',
      },
    });
  }

  async removeStudentFromProject(userId: string, projectId: string) {
    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  }

  async getStudentStats(userId: string, projectId: string) {
    const [testAttempts, homeworkSubmissions, avgScore] = await Promise.all([
      this.prisma.testAttempt.findMany({
        where: { userId, projectId, status: 'CHECKED' },
        include: {
          submission: { include: { check: true } },
          test: { select: { topic: true, difficulty: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.homeworkSubmission.findMany({
        where: { userId, projectId },
        include: {
          review: true,
          assignment: { select: { title: true, dueAt: true } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.testCheck.aggregate({
        _avg: { score: true },
        where: {
          submission: { attempt: { userId, projectId } },
        },
      }),
    ]);

    return {
      testAttempts,
      homeworkSubmissions,
      avgScore: Math.round(avgScore._avg.score || 0),
      totalTests: testAttempts.length,
      totalHomework: homeworkSubmissions.length,
    };
  }
}
