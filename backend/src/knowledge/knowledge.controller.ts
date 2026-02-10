import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  async initiateUpload(
    @Request() req: any,
    @Body()
    body: {
      projectId: string;
      filename: string;
      contentType: string;
    },
  ) {
    return this.knowledgeService.initiateUpload(
      body.projectId,
      req.user.userId,
      body,
    );
  }

  @Post(':documentId/confirm')
  async confirmUpload(
    @Request() req: any,
    @Param('documentId') documentId: string,
  ) {
    return this.knowledgeService.confirmUpload(documentId, req.user.userId);
  }

  @Get('documents')
  async listDocuments(@Query('projectId') projectId: string) {
    const documents = await this.knowledgeService.listDocuments(projectId);
    return { documents };
  }
}
