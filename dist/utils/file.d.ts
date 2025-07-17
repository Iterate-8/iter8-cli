/**
 * Reads a file safely, returning its contents or undefined if not found.
 * @param path Path to the file
 */
export declare function readFileSafe(path: string): Promise<string | undefined>;
/**
 * Writes data to a file safely.
 * @param path Path to the file
 * @param data Data to write
 */
export declare function writeFileSafe(path: string, data: string): Promise<void>;
