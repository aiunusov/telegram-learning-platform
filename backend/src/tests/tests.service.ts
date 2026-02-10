import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiCore: AiCoreService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  /** Generate tests using AI. Returns job ID for async processing. */
  async generateTests(
    userId: string,
    params: {
      projectId: string;
      topics: string[];
      difficulty: string;
      count: number;
    },
  ) {
    // Generate tests synchronously for MVP (in production, use Bull queue)
    const jobId = `job_${Date.now()}`;

    // Run in background
    this.doGenerateTests(userId, params, jobId).catch((err) =>
      this.logger.error(`Test generation failed: ${err}`),
    );

    return { jobId };
  }

  private async doGenerateTests(
    userId: string,
    params: {
      projectId: string;
      topics: string[];
      difficulty: string;
      count: number;
    },
    jobId: string,
  ) {
    try {
      const specs = await this.aiCore.generateTests({
        projectId: params.projectId,
        topics: params.topics,
        difficulty: params.difficulty as 'easy' | 'medium' | 'hard',
        count: params.count,
      });

      for (const spec of specs) {
        await this.prisma.test.create({
          data: {
            projectId: params.projectId,
            topic: spec.topic,
            difficulty: spec.difficulty,
            status: 'DRAFT',
            spec: spec as any,
          },
        });
      }

      await this.eventDispatcher.dispatch({
        projectId: params.projectId,
        userId,
        type: 'tests_generated',
        payload: {
          jobId,
          count: specs.length,
          topics: params.topics,
        },
      });

      this.logger.log(
        `Generated ${specs.length} tests for project ${params.projectId}`,
      );
    } catch (error) {
      this.logger.error(`Test generation error: ${error}`);
    }
  }

  /** List tests for a project with optional status filter. */
  async listTests(projectId: string, status?: string) {
    return this.prisma.test.findMany({
      where: {
        projectId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        topic: true,
        difficulty: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        _count: { select: { attempts: true } },
      },
    });
  }

  /** Get a test by ID. */
  async getTest(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  /** Publish a draft test. */
  async publishTest(testId: string, userId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) throw new NotFoundException('Test not found');

    const updated = await this.prisma.test.update({
      where: { id: testId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await this.eventDispatcher.dispatch({
      projectId: test.projectId,
      userId,
      type: 'test_published',
      payload: { testId, topic: test.topic },
    });

    return updated;
  }
}
