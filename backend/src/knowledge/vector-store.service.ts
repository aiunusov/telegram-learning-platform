import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Store a chunk with its embedding. */
  async upsertChunkEmbedding(
    chunkId: string,
    embedding: number[],
  ): Promise<void> {
    const embeddingStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE knowledge_chunks SET embedding = $1::vector WHERE id = $2::uuid`,
      embeddingStr,
      chunkId,
    );
  }

  /** Search for similar chunks by embedding. */
  async similaritySearch(
    projectId: string,
    queryEmbedding: number[],
    limit = 5,
    threshold = 0.3,
  ): Promise<
    Array<{
      id: string;
      text: string;
      documentId: string;
      similarity: number;
    }>
  > {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        text: string;
        document_id: string;
        similarity: number;
      }>
    >(
      `SELECT id, text, document_id,
       1 - (embedding <=> $1::vector) as similarity
       FROM knowledge_chunks
       WHERE project_id = $2::uuid
       AND embedding IS NOT NULL
       AND 1 - (embedding <=> $1::vector) > $3
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      embeddingStr,
      projectId,
      threshold,
      limit,
    );

    return results.map((r) => ({
      id: r.id,
      text: r.text,
      documentId: r.document_id,
      similarity: r.similarity,
    }));
  }
}
