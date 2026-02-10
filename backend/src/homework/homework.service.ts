import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';
import {
  HomeworkSubmissionPayloadSchema,
  HomeworkReviewPayloadSchema,
} from '../common/contracts';

@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  /** Submit homework. */
  async submit(userId: string, payload: any) {
    const validated = HomeworkSubmissionPayloadSchema.parse(payload);

    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        projectId: validated.projectId,
        userId,
        assignmentId: validated.assignmentId,
        contentType: validated.contentType,
        contentText: validated.contentText,
        fileUrl: validated.fileUrl,
        status: 'SUBMITTED',
      },
    });

    await this.eventDispatcher.dispatch({
      projectId: validated.projectId,
      userId,
      type: 'homework_submitted',
      payload: { submissionId: submission.id },
    });

    return submission;
  }

  /** List submissions for a student. */
  async listStudentSubmissions(userId: string, projectId: string) {
    return this.prisma.homeworkSubmission.findMany({
      where: { userId, projectId },
      include: {
        review: true,
        assignment: { select: { title: true, instructions: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** List submissions for admin review. */
  async listAdminSubmissions(projectId: string, status?: string) {
    return this.prisma.homeworkSubmission.findMany({
      where: {
        projectId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, username: true } },
        review: true,
        assignment: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** Admin reviews a homework submission. */
  async review(
    submissionId: string,
    adminUserId: string,
    payload: any,
  ) {
    const validated = HomeworkReviewPayloadSchema.parse(payload);

    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Update submission status
    await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: { status: validated.status as any },
    });

    // Create review record
    const review = await this.prisma.homeworkReview.create({
      data: {
        submissionId,
        adminUserId,
        score: validated.score,
        comment: validated.comment,
      },
    });

    await this.eventDispatcher.dispatch({
      projectId: submission.projectId,
      userId: submission.userId,
      type: 'homework_reviewed',
      payload: {
        submissionId,
        status: validated.status,
        score: validated.score,
      },
    });

    return review;
  }
}
