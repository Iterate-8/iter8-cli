import chalk from 'chalk';

/**
 * Logs an info message to the console.
 * @param message The message to log
 */
export function logInfo(message: string) {
  console.log(chalk.cyan('[INFO]'), message);
}

/**
 * Logs an error message to the console.
 * @param error The error or message to log
 */
export function logError(error: unknown) {
  if (error instanceof Error) {
    console.error(chalk.red('[ERROR]'), error.message);
  } else {
    console.error(chalk.red('[ERROR]'), error);
  }
}
