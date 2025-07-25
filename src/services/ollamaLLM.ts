// @ts-ignore
import fetch from 'node-fetch';
import { logError, logInfo } from '../utils/logger.js';
import { buildConfig } from '../config/buildConfig.js';

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
 * Ollama LLM Service for local code generation using Qwen/Qwen1.5-Code or similar model.
 * Requires Ollama (https://ollama.com/) running locally with a compatible model.
 */
class OllamaLLMService {
  private apiUrl: string;
  private model: string;
  private isAvailable: boolean | null = null;

  constructor() {
    this.apiUrl = buildConfig.ollama?.apiUrl || 'http://localhost:11434/api/generate';
    this.model = buildConfig.ollama?.model || 'qwen2.5-coder:7b';
  }

  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      // Try to reach Ollama server
      const response = await fetch('http://localhost:11434/api/version', {
        method: 'GET',
        // timeout: 5000
      });

      if (!response.ok) {
        this.isAvailable = false;
        return false;
      }

      // Check if the model is available
      const modelResponse = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        // timeout: 5000
      });

      if (modelResponse.ok) {
        const modelsData: any = await modelResponse.json(); // Explicitly type as any
        const models = Array.isArray(modelsData?.models) ? modelsData.models : [];
        const hasModel = models.some((m: any) => typeof m === 'object' && m.name === this.model);
        if (!hasModel) {
          logError(`Model ${this.model} not found. Available models: ${models.map((m: any) => m.name).join(', ')}`);
          this.isAvailable = false;
          return false;
        }
      }

      this.isAvailable = true;
      logInfo(`Ollama service available with model: ${this.model}`);
      return true;
    } catch (error) {
      logError(`Ollama not available: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  async generateCodeChanges(feedback: string): Promise<GeneratedChanges> {
    if (!(await this.checkAvailability())) {
      throw new Error(`Ollama service not available. Please ensure Ollama is running and model ${this.model} is installed.`);
    }

    const prompt = this.buildPrompt(feedback);

    try {
      logInfo(`Generating code changes with model: ${this.model}`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for more consistent code generation
            top_p: 0.9,
            top_k: 40,
            num_predict: 4000, // Allow longer responses
            stop: ['</response>', '```\n\n'] // Stop tokens to prevent overgeneration
          }
        }),
        // timeout: 60000 // 60 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      let rawResponse = data.response || data.choices?.[0]?.text;
      
      if (!rawResponse) {
        throw new Error('No response from Ollama LLM');
      }

      logInfo(`Raw LLM response length: ${rawResponse.length} characters`);

      // Parse the JSON response
      const parsed = this.parseResponse(rawResponse);
      
      // Validate the response
      this.validateResponse(parsed);

      logInfo(`Successfully generated ${parsed.changes?.length || 0} code changes`);

      return {
        changes: parsed.changes || [],
        summary: parsed.summary || 'Generated changes based on feedback'
      };
    } catch (error) {
      logError(`Failed to generate code changes: ${error}`);
      throw error;
    }
  }

  private buildPrompt(feedback: string): string {
    return `You are an expert software engineer and code architect. You will receive a user request and must generate precise, production-ready code changes.

USER REQUEST:
"""
${feedback}
"""

IMPORTANT INSTRUCTIONS:
1. Analyze the request carefully and determine what code changes are needed
2. Generate complete, working code that follows best practices
3. Use TypeScript/JavaScript syntax with proper typing where applicable
4. Include proper error handling and validation
5. Add meaningful comments for complex logic
6. Ensure all imports and dependencies are correct
7. Make code readable and maintainable
8. Only create new files if absolutely necessary - prefer modifying existing files

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no explanations):

{
  "changes": [
    {
      "filePath": "path/to/file.ts",
      "content": "complete file content here",
      "description": "clear description of what this change does"
    }
  ],
  "summary": "brief summary of all changes made"
}

CRITICAL REQUIREMENTS:
- Output MUST be valid JSON only
- No markdown code blocks
- No explanatory text before or after JSON
- Include complete file contents, not just diffs
- Ensure all syntax is correct and code will compile/run`;
  }

  private parseResponse(response: string): any {
    try {
      // Clean up the response
      let cleaned = response.trim()
        .replace(/^```json\s*/i, '') // Remove markdown json blocks
        .replace(/\s*```\s*$/i, '')
        .replace(/\u201c|\u201d/g, '"') // Smart double quotes
        .replace(/\u2018|\u2019/g, "'") // Smart single quotes
        .replace(/^[\uFEFF]/, '') // Remove BOM
        .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas

      // Try direct parse first
      try {
        return JSON.parse(cleaned);
      } catch (firstError) {
        // Try to extract JSON from the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0]
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\/\/.*$/gm, ''); // Remove line comments
          return JSON.parse(jsonStr);
        }
        throw firstError;
      }
    } catch (error) {
      logError(`Failed to parse LLM response as JSON: ${error}`);
      logError(`Raw response: ${response.substring(0, 500)}...`);
      // Return a fallback response
      return {
        changes: [{
          filePath: 'generated_code.ts',
          content: `// Generated code based on request\n// TODO: Implement based on: [request]\n\nexport function generatedFunction() {\n  console.log('Implementation needed');\n}`,
          description: `Fallback code generation.`
        }],
        summary: 'Generated fallback code due to parsing error'
      };
    }
  }

  private validateResponse(parsed: any): void {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object');
    }

    if (!Array.isArray(parsed.changes)) {
      throw new Error('Response must contain a "changes" array');
    }

    if (typeof parsed.summary !== 'string') {
      parsed.summary = 'Generated code changes';
    }

    // Validate each change
    parsed.changes.forEach((change: any, index: number) => {
      if (!change.filePath || typeof change.filePath !== 'string') {
        throw new Error(`Change ${index} missing valid filePath`);
      }
      if (!change.content || typeof change.content !== 'string') {
        throw new Error(`Change ${index} missing valid content`);
      }
      if (!change.description) {
        change.description = `Updated ${change.filePath}`;
      }
    });
  }

  // Test method to verify Ollama is working
  async test(): Promise<boolean> {
    try {
      const available = await this.checkAvailability();
      if (!available) return false;

      const testResult = await this.generateCodeChanges('Create a simple hello world function');
      return testResult.changes.length > 0;
    } catch (error) {
      logError(`Ollama test failed: ${error}`);
      return false;
    }
  }

  getConfig(): { apiUrl: string; model: string; isAvailable: boolean | null } {
    return {
      apiUrl: this.apiUrl,
      model: this.model,
      isAvailable: this.isAvailable
    };
  }
}

export const ollamaLLMService = new OllamaLLMService();