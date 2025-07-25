import fs from 'fs-extra';
import path from 'path';
import { embedText } from './embedding.js';
import { CodeChunk } from './vectorStore.js';

const CACHE_FILE = '.codebase_index.json';

export async function loadIndexCache(rootDir: string): Promise<CodeChunk[] | null> {
  const cachePath = path.join(rootDir, CACHE_FILE);
  if (await fs.pathExists(cachePath)) {
    try {
      const data = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return null;
    }
  }
  return null;
}

export async function saveIndexCache(rootDir: string, chunks: CodeChunk[]): Promise<void> {
  const cachePath = path.join(rootDir, CACHE_FILE);
  await fs.writeFile(cachePath, JSON.stringify(chunks, null, 2), 'utf8');
}

export async function getAllCodeFiles(dir: string, exts = ['.js', '.ts', '.tsx', '.jsx']): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      files.push(...await getAllCodeFiles(fullPath, exts));
    } else if (exts.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function chunkFile(filePath: string): Promise<{ content: string, filePath: string, mtimeMs: number }[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const stat = await fs.stat(filePath);
  return [{ content, filePath, mtimeMs: stat.mtimeMs }];
}

export async function indexCodebase(rootDir = './', progressCallback?: (msg: string) => void): Promise<CodeChunk[]> {
  const files = await getAllCodeFiles(rootDir);
  const chunks: CodeChunk[] = [];
  for (const filePath of files) {
    if (progressCallback) progressCallback(`Embedding: ${filePath}`);
    const chunkArr = await chunkFile(filePath);
    for (const { content, filePath: chunkPath } of chunkArr) {
      if (progressCallback) progressCallback(`Embedding chunk: ${chunkPath} (${content.length} chars)`);
      const embedding = await embedText(content);
      chunks.push({
        id: `${chunkPath}`,
        filePath: chunkPath,
        content,
        embedding
      });
    }
  }
  if (progressCallback) progressCallback(`Indexing complete. Total chunks: ${chunks.length}`);
  return chunks;
}
