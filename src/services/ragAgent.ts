import fs from 'fs-extra';
import path from 'path';
import { embedText } from './embedding.js';
import { addChunk, searchRelevantChunks, CodeChunk } from './vectorStore.js';
import { ollamaLLMService } from './ollamaLLM.js';

// Helper: Recursively get all code files in the project
async function getAllCodeFiles(dir: string, exts = ['.js', '.ts', '.tsx', '.jsx']): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
      files = files.concat(await getAllCodeFiles(fullPath, exts));
    } else if (entry.isFile() && exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Helper: Chunk a file (for now, just use the whole file as one chunk)
async function chunkFile(filePath: string): Promise<{ content: string, filePath: string }[]> {
  const content = await fs.readFile(filePath, 'utf8');
  return [{ content, filePath }];
}

// Index the codebase (call once at startup or on demand)
export async function indexCodebase(rootDir = './') {
  const files = await getAllCodeFiles(rootDir);
  if (!files || files.length === 0) {
    throw new Error(`[RAG] No code files found for indexing in ${rootDir}`);
  }
  const skippedFiles: string[] = [];
  for (const filePath of files) {
    const chunks = await chunkFile(filePath);
    if (!chunks || chunks.length === 0) {
      throw new Error(`[RAG] chunkFile returned no content for: ${filePath}`);
    }
    for (const { content, filePath: chunkPath } of chunks) {
      // Skip empty content
      if (!content || content.trim().length === 0) {
        skippedFiles.push(chunkPath);
        continue;
      }
      const embedding = await embedText(content);
      addChunk({
        id: `${chunkPath}`,
        filePath: chunkPath,
        content,
        embedding
      });
    }
  }
  if (skippedFiles.length > 0) {
    // Optionally, surface skipped files in the CLI UI by returning them or logging
    // For now, just ignore or log to a file if needed
    // Example: fs.writeFileSync('skipped_files.log', skippedFiles.join('\n'));
  }
}

// Build a prompt for the LLM
function buildPrompt(userQuery: string, relevantChunks: CodeChunk[]): string {
  const context = relevantChunks.map(chunk => `// File: ${chunk.filePath}\n${chunk.content}`).join('\n\n');
  return `You are an expert code agent. Here is relevant code context:\n\n${context}\n\nUser instruction:\n${userQuery}\n\nYour task:\n- Make only the necessary changes.\n- Output a JSON object with file changes as described in the system prompt.\n- Do not include explanations or markdown.`;
}

// Main RAG agent function
export async function runRagAgent(userQuery: string): Promise<any> {
  // 1. Retrieve relevant code
  const relevantChunks = await searchRelevantChunks(userQuery, 5);
  // 2. Build prompt
  const prompt = buildPrompt(userQuery, relevantChunks);
  // 3. Call Ollama LLM for code changes
  const result = await ollamaLLMService.generateCodeChanges(prompt);
  return result;
}