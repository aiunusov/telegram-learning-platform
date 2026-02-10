import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { RuntimeModule } from './runtime/runtime.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TestsModule } from './tests/tests.module';
import { HomeworkModule } from './homework/homework.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiCoreModule } from './ai-core/ai-core.module';
import { EventsModule } from './events/events.module';
import { N8nModule } from './n8n-integration/n8n.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectsModule,
    RuntimeModule,
    KnowledgeModule,
    TestsModule,
    HomeworkModule,
    AnalyticsModule,
    AiCoreModule,
    EventsModule,
    N8nModule,
  ],
})
export class AppModule {}
