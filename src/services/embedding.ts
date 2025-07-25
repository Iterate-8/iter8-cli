import { pipeline } from '@xenova/transformers';
import ora from 'ora';

export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }
  
  const spinner = ora('Generating embedding...').start();
  
  try {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    spinner.succeed('Embedding generated');
    
    // Debug: log output structure
    if (process.env.DEBUG) {
      console.log('Raw output type:', typeof output);
      console.log('Raw output:', output);
      if (output && typeof output === 'object' && 'data' in output) {
        console.log('Output data shape:', output.data?.length);
      }
    }
    
    // Handle the tensor output properly
    if (output && typeof output === 'object' && 'data' in output) {
      // For transformers.js, the actual data is in the .data property
      const embedding = Array.from(output.data as Float32Array);
      
      if (embedding.length === 0) {
        throw new Error('Empty embedding returned from model');
      }
      
      return embedding;
    }
    
    // Fallback for direct array output (older versions)
    if (Array.isArray(output)) {
      if (output.length > 0 && Array.isArray(output[0])) {
        // Handle 2D array case [batch_size, embedding_dim]
        return output[0] as number[];
      }
      if (output.length > 0 && typeof output[0] === 'number') {
        // Handle 1D array case
        return output as number[];
      }
    }
    
    throw new Error('Unexpected output format from embedding model');
    
  } catch (err) {
    spinner.fail('Failed to generate embedding');
    
    // Provide more helpful error messages
    if (err instanceof Error) {
      if (err.message.includes('404')) {
        throw new Error('Model not found. Please check the model name.');
      }
      if (err.message.includes('network') || err.message.includes('fetch')) {
        throw new Error('Network error while downloading model. Please check your internet connection.');
      }
    }
    
    throw err;
  }
}