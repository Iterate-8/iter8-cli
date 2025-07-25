import { pipeline, env } from '@xenova/transformers';
import { logInfo, logError } from '../utils/logger.js';

// Configure transformers environment
env.allowLocalModels = false;
env.useBrowserCache = false;

class EmbeddingService {
  private extractor: any = null;
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2';
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      logInfo('Loading embedding model...');
      
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            logInfo(`Downloading model: ${percent}%`);
          }
        }
      });
      
      this.isInitialized = true;
      logInfo('Embedding model loaded successfully');
    } catch (error) {
      this.initPromise = null;
      logError(`Failed to load embedding model: ${error}`);
      throw error;
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    // Truncate very long text to prevent issues
    const maxLength = 8000; // Conservative limit
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;

    try {
      await this.initialize();

      if (!this.extractor) {
        throw new Error('Embedding model not initialized');
      }

      const output = await this.extractor(truncatedText, { 
        pooling: 'mean', 
        normalize: true 
      });

      const embedding = this.extractEmbeddingFromOutput(output);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned from model');
      }

      // Validate embedding dimensions (should be 384 for all-MiniLM-L6-v2)
      if (embedding.length !== 384) {
        logError(`Unexpected embedding dimension: ${embedding.length}, expected 384`);
      }

      return embedding;
    } catch (error) {
      logError(`Embedding generation failed: ${error}`);
      throw error;
    }
  }

  private extractEmbeddingFromOutput(output: any): number[] {
    try {
      // Handle different output formats from transformers.js
      if (output && typeof output === 'object') {
        // Check for .data property (newer versions)
        if ('data' in output && output.data) {
          return Array.from(output.data as Float32Array);
        }

        // Check for tensor-like structure
        if ('tolist' in output && typeof output.tolist === 'function') {
          const result = output.tolist();
          return Array.isArray(result[0]) ? result[0] : result;
        }

        // Check if it's already an array-like object
        if (output.length !== undefined) {
          return Array.from(output);
        }
      }

      // Handle direct array output (older versions)
      if (Array.isArray(output)) {
        if (output.length > 0 && Array.isArray(output[0])) {
          return output[0] as number[];
        }
        if (output.length > 0 && typeof output[0] === 'number') {
          return output as number[];
        }
      }

      throw new Error('Unexpected output format from embedding model');
    } catch (error) {
      logError(`Failed to extract embedding from output: ${error}`);
      throw error;
    }
  }

  // Test method to verify the service is working
  async test(): Promise<boolean> {
    try {
      const testEmbedding = await this.embedText('Hello, world!');
      return testEmbedding.length > 0;
    } catch (error) {
      logError(`Embedding service test failed: ${error}`);
      return false;
    }
  }

  // Get model information
  getModelInfo(): { name: string; isInitialized: boolean } {
    return {
      name: this.modelName,
      isInitialized: this.isInitialized
    };
  }
}

// Singleton instance
const embeddingService = new EmbeddingService();

// Export the main function for backward compatibility
export async function embedText(text: string): Promise<number[]> {
  return embeddingService.embedText(text);
}

// Export service instance for advanced usage
export { embeddingService };