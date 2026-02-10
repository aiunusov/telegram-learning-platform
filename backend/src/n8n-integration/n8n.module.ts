import { Module } from '@nestjs/common';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [N8nController],
  providers: [N8nService],
  exports: [N8nService],
})
export class N8nModule {}
