import OpenAI from 'openai';
import dotenv from 'dotenv';
import { readFileSafe } from '../utils/file.js';
import { glob } from 'glob';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CodeChange {
  filePath: string;
  originalContent: string;
  newContent: string;
  description: string;
  confidence: number;
}

export interface ChangePlan {
  changes: CodeChange[];
  summary: string;
  estimatedTime: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AIService {
  /**
   * Analyze feedback and generate code changes
   */
  static async analyzeFeedbackAndGenerateChanges(
    feedback: string,
    startupName: string,
    projectRoot: string = process.cwd()
  ): Promise<ChangePlan> {
    try {
      // Get project structure and key files
      const projectStructure = await this.getProjectStructure(projectRoot);
      const keyFiles = await this.getKeyFiles(projectRoot);
      
      const prompt = this.buildAnalysisPrompt(feedback, startupName, projectStructure, keyFiles);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert software developer who analyzes user feedback and generates precise code changes. You must provide changes in a specific JSON format and be very careful about the changes you suggest."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      return this.parseAIResponse(content, projectRoot);
    } catch (error) {
      throw new Error(`AI analysis failed: ${(error as Error).message}`);
    }
  }

  private static async getProjectStructure(projectRoot: string): Promise<string> {
    const files = await glob('**/*', { 
      cwd: projectRoot, 
      ignore: ['node_modules/**', 'dist/**', '.git/**', '*.log', '.env*'] 
    });
    
    return files.slice(0, 50).join('\n'); // Limit to first 50 files
  }

  private static async getKeyFiles(projectRoot: string): Promise<Record<string, string>> {
    const keyFilePatterns = [
      'package.json',
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      '*.config.js',
      '*.config.ts',
      'README.md'
    ];

    const keyFiles: Record<string, string> = {};
    
    for (const pattern of keyFilePatterns) {
      const files = await glob(pattern, { cwd: projectRoot });
      for (const file of files.slice(0, 10)) { // Limit to first 10 files per pattern
        const content = await readFileSafe(path.join(projectRoot, file));
        if (content) {
          keyFiles[file] = content;
        }
      }
    }

    return keyFiles;
  }

  private static buildAnalysisPrompt(
    feedback: string, 
    startupName: string, 
    projectStructure: string, 
    keyFiles: Record<string, string>
  ): string {
    return `
Analyze this user feedback and generate specific code changes to implement the requested features.

USER FEEDBACK: "${feedback}"
STARTUP: ${startupName}

PROJECT STRUCTURE:
${projectStructure}

KEY FILES CONTENT:
${Object.entries(keyFiles).map(([file, content]) => `\n--- ${file} ---\n${content.substring(0, 1000)}...`).join('\n')}

INSTRUCTIONS:
1. Analyze the feedback to understand what features or changes are requested
2. Identify which files need to be modified
3. Generate specific code changes in the following JSON format:

{
  "summary": "Brief description of what will be implemented",
  "estimatedTime": "Estimated time to implement (e.g., '5-10 minutes')",
  "riskLevel": "low|medium|high",
  "changes": [
    {
      "filePath": "path/to/file.ts",
      "description": "What this change does",
      "confidence": 0.95,
      "originalContent": "exact original content to replace",
      "newContent": "exact new content"
    }
  ]
}

IMPORTANT RULES:
- Only suggest changes you are very confident about
- Provide exact content matches for originalContent
- Keep changes minimal and focused
- Consider the existing codebase structure
- If the request is too vague or risky, set riskLevel to "high"
- If no changes are needed, return empty changes array
`;
  }

  private static parseAIResponse(content: string, projectRoot: string): ChangePlan {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and process the changes
      const changes: CodeChange[] = parsed.changes?.map((change: any) => ({
        filePath: change.filePath,
        originalContent: change.originalContent,
        newContent: change.newContent,
        description: change.description,
        confidence: Math.min(Math.max(change.confidence || 0.5, 0), 1)
      })) || [];

      return {
        changes,
        summary: parsed.summary || 'No summary provided',
        estimatedTime: parsed.estimatedTime || 'Unknown',
        riskLevel: parsed.riskLevel || 'medium'
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
    }
  }
} 