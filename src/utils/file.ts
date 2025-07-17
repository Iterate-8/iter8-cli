import fs from 'fs-extra';

/**
 * Reads a file safely, returning its contents or undefined if not found.
 * @param path Path to the file
 */
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

/**
 * Writes data to a file safely.
 * @param path Path to the file
 * @param data Data to write
 */
export async function writeFileSafe(path: string, data: string): Promise<void> {
  try {
    await fs.outputFile(path, data);
  } catch (err) {
    throw new Error('Failed to write file: ' + (err as Error).message);
  }
}
