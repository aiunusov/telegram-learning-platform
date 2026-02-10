import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** List projects for a user (owned or member). */
  async findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create a new project. Owner becomes ADMIN member. */
  async create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: {
        members: true,
      },
    });
  }

  /** Get project by ID with access check. */
  async findById(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: { include: { user: true } },
        _count: {
          select: {
            knowledgeDocuments: true,
            tests: true,
            homeworkSubmissions: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /** Check if user is admin of project. */
  async isAdmin(projectId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    return member?.role === 'ADMIN';
  }
}
