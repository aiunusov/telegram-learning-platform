import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiCore: AiCoreService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  /** Initiate a document upload. Returns ID and presigned URL placeholder. */
  async initiateUpload(
    projectId: string,
    userId: string,
    params: { filename: string; contentType: string },
  ) {
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        projectId,
        filename: params.filename,
        status: 'UPLOADED',
        storageUrl: `uploads/${projectId}/${Date.now()}_${params.filename}`,
        metadata: { contentType: params.contentType, uploadedBy: userId },
      },
    });

    return {
      documentId: document.id,
      uploadUrl: document.storageUrl,
    };
  }

  /** Confirm upload and start processing/indexing. */
  async confirmUpload(documentId: string, userId: string) {
    const document = await this.prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Mark as processing
    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // Process in background
    this.processDocument(document.id, document.projectId, userId).catch(
      (err) => this.logger.error(`Document processing failed: ${err}`),
    );

    return { status: 'processing' };
  }

  /** List documents for a project. */
  async listDocuments(projectId: string) {
    return this.prisma.knowledgeDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        status: true,
        createdAt: true,
        metadata: true,
        _count: { select: { chunks: true } },
      },
    });
  }

  /** Process a document: chunk text and generate embeddings. */
  private async processDocument(
    documentId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      this.logger.log(`Processing document ${documentId}`);

      // For MVP: simulate reading file content
      // In production, download from storageUrl and parse (PDF, DOCX, etc.)
      const document = await this.prisma.knowledgeDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) return;

      // For now, create a placeholder chunk
      // In production: parse file → split into chunks → embed each
      const sampleText = `Content from document: ${document.filename}`;
      const chunks = this.splitIntoChunks(sampleText, 500);

      for (const chunkText of chunks) {
        await this.prisma.knowledgeChunk.create({
          data: {
            projectId,
            documentId,
            text: chunkText,
            metadata: { source: document.filename },
          },
        });
      }

      // Mark as indexed
      await this.prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: 'INDEXED' },
      });

      await this.eventDispatcher.dispatch({
        projectId,
        userId,
        type: 'document_indexed',
        payload: { documentId, filename: document.filename },
      });

      this.logger.log(`Document ${documentId} indexed successfully`);
    } catch (error) {
      this.logger.error(`Document processing failed: ${error}`);
      await this.prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    }
  }

  /** Split text into chunks of maxLength characters. */
  private splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);
    let current = '';

    for (const paragraph of paragraphs) {
      if (current.length + paragraph.length > maxLength && current) {
        chunks.push(current.trim());
        current = '';
      }
      current += paragraph + '\n\n';
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }
}
