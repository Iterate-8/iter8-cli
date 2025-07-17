import OpenAI from 'openai';
import { logError } from '../utils/logger.js';

export interface CodeChange {
  filePath: string;
  content: string;
  description: string;
}

export interface GeneratedChanges {
  changes: CodeChange[];
  summary: string;
}

class OpenAIService {
  private client: OpenAI | null = null;

  async initialize(): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateCodeChanges(feedback: string): Promise<GeneratedChanges> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const prompt = `
You are a helpful coding assistant. Based on the following feedback/ticket, generate actual code changes that could be applied to improve the system.

Feedback: "${feedback}"

Please generate:
1. Specific file changes with file paths
2. Actual code snippets that could be applied
3. A brief description of what each change does

Format your response as JSON with this structure:
{
  "changes": [
    {
      "filePath": "path/to/file.ts",
      "content": "// actual code content here",
      "description": "What this change does"
    }
  ],
  "summary": "Brief summary of all changes"
}

Make the changes realistic and applicable to a TypeScript/JavaScript project. If the feedback is vague, make reasonable assumptions about what improvements could be made.
`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coding assistant that generates specific, actionable code changes based on feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(response);
        return {
          changes: parsed.changes || [],
          summary: parsed.summary || 'Generated changes based on feedback'
        };
      } catch (parseError) {
        // If JSON parsing fails, create a fallback response
        return {
          changes: [{
            filePath: 'src/improvements.ts',
            content: `// Generated improvement based on feedback: ${feedback}\n\nexport function applyImprovement() {\n  // TODO: Implement based on feedback\n  console.log('Improvement applied');\n}`,
            description: `Generated improvement for: ${feedback}`
          }],
          summary: `Generated fallback changes for feedback: ${feedback}`
        };
      }
    } catch (error) {
      logError('Failed to generate code changes:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService(); 