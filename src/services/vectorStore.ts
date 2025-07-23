import { embedText } from './embedding.js';

export interface CodeChunk {
  id: string;
  filePath: string;
  content: string;
  embedding: number[];
}

const vectorStore: CodeChunk[] = [];

export function addChunk(chunk: CodeChunk) {
  vectorStore.push(chunk);
}

export function getAllChunks(): CodeChunk[] {
  return vectorStore;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

export async function searchRelevantChunks(query: string, topN = 5): Promise<CodeChunk[]> {
  // Surface empty query errors to the CLI UI
  if (!query || query.trim().length === 0) {
    throw new Error('[VectorStore] Skipping embedding for empty query');
  }
  // Optionally, you could return a debug object instead of throwing, if you want to handle it gracefully in the UI
  // e.g. return [{ id: 'debug', filePath: '', content: '', embedding: [], debug: '[VectorStore] Skipping embedding for empty query' }];
  const queryEmbedding = await embedText(query);
  return vectorStore
    .map(chunk => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(res => res.chunk);
}