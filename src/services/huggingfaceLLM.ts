import { pipeline, env } from '@xenova/transformers';
import { logError, logInfo } from '../utils/logger.js';
import { buildConfig } from '../config/buildConfig.js';

// Configure transformers environment for better Mac compatibility
try {
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1; // Better for Mac stability
  }
} catch (e) {
  logError('Failed to configure transformers environment: ' + e);
}

export interface CodeChange {
  filePath: string;
  content: string;
  description: string;
}

export interface GeneratedChanges {
  changes: CodeChange[];
  summary: string;
}

/**
 * HuggingFace LLM Service optimized for Mac using transformers.js
 * Uses smaller models that can run efficiently on Mac hardware
 */
class HuggingFaceLLMService {
  private generator: any = null;
  private readonly modelName: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Use a smaller, Mac-friendly model
    this.modelName = buildConfig.huggingface?.model || 'Xenova/LaMini-Flan-T5-248M';
  }

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
      logInfo(`Loading HuggingFace model: ${this.modelName}`);
      this.generator = await pipeline('text2text-generation', this.modelName, {
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            logInfo(`Downloading model: ${percent}% (${Math.round(progress.loaded / 1024 / 1024)}MB/${Math.round(progress.total / 1024 / 1024)}MB)`);
          } else if (progress.status === 'ready') {
            logInfo('Model ready for inference');
          }
        }
        // Removed device and dtype properties to fix type errors
      });
      this.isInitialized = true;
      logInfo('HuggingFace LLM initialized successfully');
      await this.testModel();
    } catch (error) {
      this.initPromise = null;
      logError(`Failed to initialize HuggingFace LLM: ${error}`);
      throw error;
    }
  }

  private async testModel(): Promise<void> {
    try {
      logInfo('Testing model with simple prompt...');
      const testResult = await this.generator('Generate a simple hello function', {
        max_length: 100,
        temperature: 0.3,
        do_sample: false, // Deterministic for testing
      });
      
      if (testResult && testResult.length > 0) {
        logInfo('Model test successful');
      } else {
        throw new Error('Model test failed - no output generated');
      }
    } catch (error) {
      logError(`Model test failed: ${error}`);
      throw error;
    }
  }

  // Accept a callback to display progress to the CLI screen
  async generateCodeChanges(feedback: string, progressCallback?: (msg: string) => void): Promise<GeneratedChanges> {
    try {
      await this.initialize();

      if (!this.generator) {
        throw new Error('HuggingFace model not initialized');
      }

      if (progressCallback) progressCallback('Generating code changes with HuggingFace model...');
      if (progressCallback) progressCallback(`[DEBUG] Prompt: ${feedback}`);
      const prompt = this.buildPrompt(feedback);
      if (progressCallback) progressCallback(`[DEBUG] Built prompt: ${prompt.substring(0, 200)}...`);
      // Generate with Mac-optimized settings
      const result = await this.generator(prompt, {
        max_length: 1024, // Reasonable length for Mac performance
        temperature: 0.1, // Low temperature for consistent code
        do_sample: true,
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.1,
        pad_token_id: 50256,
        eos_token_id: 50256,
      });
      if (progressCallback) progressCallback(`[DEBUG] Model generation result: ${JSON.stringify(result).substring(0, 500)}...`);
      if (!result || result.length === 0) {
        throw new Error('No response from HuggingFace model');
      }
      const generatedText = Array.isArray(result) ? result[0].generated_text : result.generated_text;
      if (progressCallback) progressCallback(`[DEBUG] Generated text: ${generatedText.substring(0, 500)}...`);
      if (!generatedText) {
        throw new Error('No generated text in model response');
      }
      if (progressCallback) progressCallback(`Generated text length: ${generatedText.length} characters`);
      // Parse the response
      const parsed = this.parseResponse(generatedText, feedback);
      if (progressCallback) progressCallback(`[DEBUG] Parsed changes: ${JSON.stringify(parsed.changes).substring(0, 500)}...`);
      if (progressCallback) progressCallback(`Successfully generated ${parsed.changes?.length || 0} code changes`);
      return parsed;
    } catch (error) {
      if (progressCallback) progressCallback(`Failed to generate code changes: ${error}`);
      logError(`Failed to generate code changes: ${error}`);
      throw error;
    }
  }

  private buildPrompt(feedback: string): string {
    // Simpler prompt optimized for smaller models
    return `Task: Generate code changes based on user feedback.

User Request: "${feedback}"

Instructions:
- Create practical code that addresses the request
- Use TypeScript syntax
- Include proper error handling
- Make code readable and well-commented

Please generate code changes in this format:
File: path/to/file.ts
Description: What this change does
Code:
[Your code here]

Generate the code now:`;
  }

  private parseResponse(generatedText: string, originalFeedback: string): GeneratedChanges {
    try {
      // Since smaller models may not generate perfect JSON,
      // we'll use a more flexible parsing approach
      const changes: CodeChange[] = [];
      
      // Try to extract file information and code
      const fileMatches = generatedText.match(/File:\s*([^\n]+)/gi);
      const descMatches = generatedText.match(/Description:\s*([^\n]+)/gi);
      const codeBlocks = this.extractCodeBlocks(generatedText);

      if (fileMatches && codeBlocks.length > 0) {
        // Parse structured output
        for (let i = 0; i < Math.min(fileMatches.length, codeBlocks.length); i++) {
          const filePath = fileMatches[i].replace(/File:\s*/i, '').trim();
          const description = descMatches && descMatches[i] 
            ? descMatches[i].replace(/Description:\s*/i, '').trim()
            : `Code changes for ${filePath}`;
          const content = codeBlocks[i];

          if (filePath && content) {
            changes.push({
              filePath: this.sanitizeFilePath(filePath),
              content: content.trim(),
              description
            });
          }
        }
      }

      // Fallback: Create a single file if no structured output
      if (changes.length === 0) {
        const cleanedCode = this.cleanGeneratedCode(generatedText);
        if (cleanedCode.length > 10) { // Only if we have substantial content
          changes.push({
            filePath: this.inferFilePathFromFeedback(originalFeedback),
            content: cleanedCode,
            description: `Generated code based on: ${originalFeedback.substring(0, 100)}...`
          });
        }
      }

      // If still no changes, create a minimal implementation
      if (changes.length === 0) {
        changes.push(this.createFallbackChange(originalFeedback));
      }

      return {
        changes,
        summary: `Generated ${changes.length} code change(s) based on: ${originalFeedback.substring(0, 50)}...`
      };
    } catch (error) {
      logError(`Failed to parse HuggingFace response: ${error}`);
      
      // Return fallback response
      return {
        changes: [this.createFallbackChange(originalFeedback)],
        summary: 'Generated fallback code due to parsing error'
      };
    }
  }

  private extractCodeBlocks(text: string): string[] {
    const codeBlocks: string[] = [];
    
    // Try to find code blocks with various patterns
    const patterns = [
      /```[\w]*\n([\s\S]*?)\n```/g, // Standard markdown code blocks
      /Code:\s*\n([\s\S]*?)(?=\n\n|\nFile:|$)/g, // Code: label pattern
      /```([\s\S]*?)```/g, // Simple code blocks
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 10) {
          codeBlocks.push(match[1].trim());
        }
      }
    }

    // If no code blocks found, try to extract the main content
    if (codeBlocks.length === 0) {
      const lines = text.split('\n');
      let codeStart = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('function') || line.includes('const') || line.includes('class') || 
            line.includes('export') || line.includes('import')) {
          codeStart = i;
          break;
        }
      }
      
      if (codeStart >= 0) {
        const codeContent = lines.slice(codeStart).join('\n');
        if (codeContent.length > 10) {
          codeBlocks.push(codeContent);
        }
      }
    }

    return codeBlocks;
  }

  private cleanGeneratedCode(text: string): string {
    return text
      .replace(/^Task:.*$/gm, '') // Remove task instructions
      .replace(/^User Request:.*$/gm, '') // Remove user request echo
      .replace(/^Instructions:.*$/gm, '') // Remove instructions
      .replace(/^Please generate.*$/gm, '') // Remove generation prompts
      .replace(/File:\s*[^\n]+/g, '') // Remove file labels
      .replace(/Description:\s*[^\n]+/g, '') // Remove descriptions
      .replace(/Generate the code now:?/g, '') // Remove generation commands
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive newlines
      .trim();
  }

  private sanitizeFilePath(filePath: string): string {
    // Clean up the file path
    let cleaned = filePath
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/\.\./g, '') // Remove directory traversal
      .trim();

    // Ensure it has a reasonable extension
    if (!cleaned.includes('.')) {
      cleaned += '.ts';
    }

    // Ensure it starts with src/ if it doesn't have a path
    if (!cleaned.includes('/')) {
      cleaned = `src/${cleaned}`;
    }

    return cleaned;
  }

  private inferFilePathFromFeedback(feedback: string): string {
    const lowerFeedback = feedback.toLowerCase();
    
    // Try to infer file type from feedback
    if (lowerFeedback.includes('component') || lowerFeedback.includes('react')) {
      return 'src/components/GeneratedComponent.tsx';
    } else if (lowerFeedback.includes('service') || lowerFeedback.includes('api')) {
      return 'src/services/generatedService.ts';
    } else if (lowerFeedback.includes('util') || lowerFeedback.includes('helper')) {
      return 'src/utils/generatedUtils.ts';
    } else if (lowerFeedback.includes('type') || lowerFeedback.includes('interface')) {
      return 'src/types/generatedTypes.ts';
    } else {
      return 'src/generated.ts';
    }
  }

  private createFallbackChange(feedback: string): CodeChange {
    const filePath = this.inferFilePathFromFeedback(feedback);
    
    const content = `// Generated code based on user feedback
// Request: ${feedback}

/**
 * TODO: Implement the requested functionality
 * This is a placeholder generated because the AI model
 * couldn't generate specific code for this request.
 */

export function implementRequestedFeature() {
  // TODO: Add implementation based on: ${feedback.substring(0, 100)}
  console.log('Feature implementation needed');
  
  throw new Error('Not implemented yet');
}

export default implementRequestedFeature;
`;

    return {
      filePath,
      content,
      description: `Placeholder implementation for: ${feedback.substring(0, 50)}...`
    };
  }

  // Test method to verify the service is working
  async test(): Promise<boolean> {
    try {
      const available = await this.checkAvailability();
      if (!available) return false;

      const testResult = await this.generateCodeChanges('Create a simple hello world function');
      return testResult.changes.length > 0;
    } catch (error) {
      logError(`HuggingFace test failed: ${error}`);
      return false;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.initialize();
      return this.isInitialized;
    } catch (error) {
      logError(`HuggingFace availability check failed: ${error}`);
      return false;
    }
  }

  getConfig(): { modelName: string; isInitialized: boolean } {
    return {
      modelName: this.modelName,
      isInitialized: this.isInitialized
    };
  }

  // Get memory usage (useful for Mac monitoring)
  getMemoryUsage(): { used: number; available: number } {
    const used = process.memoryUsage();
    return {
      used: Math.round(used.heapUsed / 1024 / 1024), // MB
      available: Math.round(used.heapTotal / 1024 / 1024) // MB
    };
  }
}

export const huggingfaceLLMService = new HuggingFaceLLMService();