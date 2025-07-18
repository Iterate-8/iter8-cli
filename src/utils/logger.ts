import chalk from 'chalk';

export function logInfo(message: string) {
  console.log(chalk.cyan('[INFO]'), message);
}

export function logError(error: unknown) {
  if (error instanceof Error) {
    console.error(chalk.red('[ERROR]'), error.message);
  } else {
    console.error(chalk.red('[ERROR]'), error);
  }
}
