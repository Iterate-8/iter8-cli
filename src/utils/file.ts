import fs from 'fs-extra';

export async function readFileSafe(path: string): Promise<string | undefined> {
  try {
    if (await fs.pathExists(path)) {
      return await fs.readFile(path, 'utf8');
    }
    return undefined;
  } catch (err) {
    throw new Error('Failed to read file: ' + (err as Error).message);
  }
}

export async function writeFileSafe(path: string, data: string): Promise<void> {
  try {
    await fs.outputFile(path, data);
  } catch (err) {
    throw new Error('Failed to write file: ' + (err as Error).message);
  }
}
