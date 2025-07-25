import { embedText } from './embedding.js';
import { logInfo, logError } from '../utils/logger.js';

export interface CodeChunk {
  id: string;
  filePath: string;
  content: string;
  embedding: number[];
}

class VectorStore {
  private chunks: Map<string, CodeChunk> = new Map();
  private readonly maxChunks = 10000; // Prevent memory issues

  addChunk(chunk: CodeChunk): void {
    if (this.chunks.size >= this.maxChunks) {
      logError(`Vector store at capacity (${this.maxChunks}). Consider clearing or increasing limit.`);
      return;
    }
    this.chunks.set(chunk.id, chunk);
  }

  getAllChunks(): CodeChunk[] {
    return Array.from(this.chunks.values());
  }

  getChunkCount(): number {
    return this.chunks.size;
  }

  clear(): void {
    this.chunks.clear();
    logInfo('Vector store cleared');
  }

  removeChunksByFile(filePath: string): void {
    const toRemove: string[] = [];
    for (const [id, chunk] of this.chunks) {
      if (chunk.filePath === filePath) {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.chunks.delete(id));
    logInfo(`Removed ${toRemove.length} chunks for file: ${filePath}`);
  }

  getFileList(): string[] {
    const files = new Set<string>();
    for (const chunk of this.chunks.values()) {
      files.add(chunk.filePath);
    }
    return Array.from(files).sort();
  }

  async searchSimilar(query: string, topN = 5, minSimilarity = 0.1): Promise<CodeChunk[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Cannot search with empty query');
    }

    if (this.chunks.size === 0) {
      logInfo('Vector store is empty - no chunks to search');
      return [];
    }

    try {
      const queryEmbedding = await embedText(query);
      
      const results = Array.from(this.chunks.values())
        .map(chunk => ({
          chunk,
          score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }))
        .filter(result => result.score >= minSimilarity) // Filter out very low similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

      logInfo(`Search found ${results.length} relevant chunks (min similarity: ${minSimilarity})`);
      
      if (results.length > 0) {
        const bestScore = results[0].score;
        const worstScore = results[results.length - 1].score;
        logInfo(`Similarity range: ${worstScore.toFixed(3)} - ${bestScore.toFixed(3)}`);
      }

      return results.map(result => result.chunk);
    } catch (error) {
      logError(`Vector search failed: ${error}`);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (denominator === 0) {
      return 0; // Handle zero vectors
    }

    return dot / denominator;
  }

  // Utility method to get statistics
  getStats(): {
    totalChunks: number;
    uniqueFiles: number;
    avgChunkSize: number;
    embeddingDimension: number | null;
  } {
    const chunks = Array.from(this.chunks.values());
    const files = new Set(chunks.map(c => c.filePath));
    
    const avgSize = chunks.length > 0 
      ? chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length 
      : 0;
    
    const embeddingDim = chunks.length > 0 ? chunks[0].embedding.length : null;

    return {
      totalChunks: chunks.length,
      uniqueFiles: files.size,
      avgChunkSize: avgSize,
      embeddingDimension: embeddingDim
    };
  }
}

// Singleton instance
const vectorStore = new VectorStore();

// Export functions for backward compatibility
export function addChunk(chunk: CodeChunk): void {
  vectorStore.addChunk(chunk);
}

export function getAllChunks(): CodeChunk[] {
  return vectorStore.getAllChunks();
}

export function clearVectorStore(): void {
  vectorStore.clear();
}

export function getVectorStoreStats() {
  return vectorStore.getStats();
}

export async function searchRelevantChunks(query: string, topN = 5): Promise<CodeChunk[]> {
  return vectorStore.searchSimilar(query, topN);
}

export function removeChunksByFile(filePath: string): void {
  vectorStore.removeChunksByFile(filePath);
}

export function getChunkCount(): number {
  return vectorStore.getChunkCount();
}

export function getFileList(): string[] {
  return vectorStore.getFileList();
}

// Advanced search with file type filtering
export async function searchByFileType(query: string, fileTypes: string[], topN = 5): Promise<CodeChunk[]> {
  const allResults = await vectorStore.searchSimilar(query, topN * 2); // Get more to filter
  
  return allResults
    .filter(chunk => {
      const ext = chunk.filePath.split('.').pop()?.toLowerCase();
      return fileTypes.includes(ext || '');
    })
    .slice(0, topN);
}

// Search with file path patterns
export async function searchWithPathPattern(query: string, pathPattern: RegExp, topN = 5): Promise<CodeChunk[]> {
  const allResults = await vectorStore.searchSimilar(query, topN * 2);
  
  return allResults
    .filter(chunk => pathPattern.test(chunk.filePath))
    .slice(0, topN);
}

// Get chunks from specific file
export function getChunksByFile(filePath: string): CodeChunk[] {
  return vectorStore.getAllChunks().filter(chunk => chunk.filePath === filePath);
}

// Update a specific chunk (useful for incremental updates)
export async function updateChunk(chunkId: string, newContent: string): Promise<void> {
  // Remove old chunk
  const chunks = vectorStore.getAllChunks();
  const existingChunk = chunks.find(c => c.id === chunkId);
  
  if (existingChunk) {
    // Create new embedding for updated content
    const { embedText } = await import('./embedding.js');
    const newEmbedding = await embedText(newContent);
    
    const updatedChunk: CodeChunk = {
      ...existingChunk,
      content: newContent,
      embedding: newEmbedding
    };
    
    // Replace the chunk
    vectorStore.addChunk(updatedChunk);
  }
};

// Optionally: expose a method to load chunks from cache
export function loadChunksToVectorStore(chunks: CodeChunk[]): void {
  clearVectorStore();
  for (const chunk of chunks) {
    addChunk(chunk);
  }
}
