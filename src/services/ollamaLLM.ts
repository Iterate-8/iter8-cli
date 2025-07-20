// @ts-ignore
import fetch from 'node-fetch';
import { logError } from '../utils/logger.js';
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

  constructor() {
    // Default to Ollama local server
    this.apiUrl = buildConfig.ollama?.apiUrl || 'http://localhost:11434/api/generate';
    this.model = buildConfig.ollama?.model || 'llama3.2:latest'; // e.g., 'qwen:latest' or 'qwen1.5-code:latest'
  }

  async generateCodeChanges(feedback: string): Promise<GeneratedChanges> {
    const prompt = `
You are a highly skilled, detail-oriented coding assistant. Based on the following feedback/ticket items, generate real, production-quality code changes that could be applied to improve the system.

Feedback items (one per line):
"""
${feedback}
"""

Your task:
1. Propose specific file changes with correct file paths (relative to the project root).
2. For each file, provide the full, correct, and readable code content that should be written to that file. Use clear formatting, proper indentation, and include all necessary imports and context for the code to work.
3. For each change, add a concise, descriptive explanation of what the change does and why.

IMPORTANT:
- Code must be correct, idiomatic, and easy to read. Use best practices for TypeScript/JavaScript/React/Node.js as appropriate.
- Do not generate placeholder or incomplete code. Only output code that could be copy-pasted into a real project and work as described.
- Use descriptive variable and function names, and add comments where helpful for clarity.
- If the feedback is vague, make reasonable, practical improvements that would benefit a real project.
- ONLY output a single JSON object, no markdown, no explanations, no extra text.
- The output MUST be valid JSON matching this structure:
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
- Do not include any text before or after the JSON object.
- Do not wrap the JSON in markdown.
`;

    try {
      // For Ollama: POST /api/generate { model, prompt, stream: false }
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false
        })
      });
      if (!res.ok) throw new Error(`LLM API error: ${res.statusText}`);
      const data: any = await res.json();
      // Ollama returns { response: string }
      let response = data.response || data.choices?.[0]?.text;
      if (!response) throw new Error('No response from LLM');
      // Try to extract JSON if extra text is present
      let parsed: any;
      // Try to parse after trimming whitespace
      try {
        parsed = JSON.parse(response.trim());
      } catch (parseError) {
        // Try to extract JSON block from the response
        const match = response.match(/\{[\s\S]*\}/);
        let jsonStr = match ? match[0] : response;
        jsonStr = jsonStr.trim();
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          throw new Error('LLM output could not be parsed as JSON. Raw output: ' + response);
        }
      }
      return {
        changes: parsed.changes || [],
        summary: parsed.summary || 'Generated changes based on feedback'
      };
    } catch (error) {
      logError(`Failed to generate code changes (LLM): ${error}`);
      throw error;
    }
  }
}

export const ollamaLLMService = new OllamaLLMService();
