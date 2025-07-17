import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { CodeChange, ChangePlan } from './ai.js';
import chalk from 'chalk';

export interface AppliedChange {
  filePath: string;
  success: boolean;
  error?: string;
  backupPath?: string;
}

export interface ChangeResult {
  changes: AppliedChange[];
  summary: string;
  backupDir?: string;
}

export class CodeModifierService {
  /**
   * Apply code changes with backup and confirmation
   */
  static async applyChanges(
    changePlan: ChangePlan,
    projectRoot: string = process.cwd()
  ): Promise<ChangeResult> {
    const backupDir = await this.createBackup(projectRoot);
    const appliedChanges: AppliedChange[] = [];

    try {
      for (const change of changePlan.changes) {
        const result = await this.applySingleChange(change, projectRoot, backupDir);
        appliedChanges.push(result);
      }

      return {
        changes: appliedChanges,
        summary: changePlan.summary,
        backupDir
      };
    } catch (error) {
      // If any change fails, attempt rollback
      await this.rollbackChanges(appliedChanges, backupDir);
      throw new Error(`Failed to apply changes: ${(error as Error).message}`);
    }
  }

  /**
   * Apply a single code change
   */
  private static async applySingleChange(
    change: CodeChange,
    projectRoot: string,
    backupDir: string
  ): Promise<AppliedChange> {
    const filePath = path.join(projectRoot, change.filePath);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        return {
          filePath: change.filePath,
          success: false,
          error: 'File does not exist'
        };
      }

      // Read current content
      const currentContent = await fs.readFile(filePath, 'utf8');
      
      // Create backup
      const backupPath = path.join(backupDir, change.filePath);
      await fs.ensureDir(path.dirname(backupPath));
      await fs.writeFile(backupPath, currentContent);

      // Verify the original content matches
      if (!currentContent.includes(change.originalContent)) {
        return {
          filePath: change.filePath,
          success: false,
          error: 'Original content does not match expected content',
          backupPath
        };
      }

      // Apply the change
      const newContent = currentContent.replace(change.originalContent, change.newContent);
      await fs.writeFile(filePath, newContent);

      return {
        filePath: change.filePath,
        success: true,
        backupPath
      };
    } catch (error) {
      return {
        filePath: change.filePath,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create a backup of the current codebase
   */
  private static async createBackup(projectRoot: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(projectRoot, '.backups', `backup-${timestamp}`);
    
    await fs.ensureDir(backupDir);
    
    // Copy key files to backup
    const filesToBackup = [
      'src/**/*',
      'package.json',
      'tsconfig.json',
      'README.md'
    ];

    for (const pattern of filesToBackup) {
      const files = await glob(pattern, { cwd: projectRoot });
      for (const file of files) {
        const sourcePath = path.join(projectRoot, file);
        const backupPath = path.join(backupDir, file);
        
        if (await fs.pathExists(sourcePath)) {
          await fs.ensureDir(path.dirname(backupPath));
          await fs.copy(sourcePath, backupPath);
        }
      }
    }

    return backupDir;
  }

  /**
   * Rollback changes using backup
   */
  private static async rollbackChanges(
    appliedChanges: AppliedChange[],
    backupDir: string
  ): Promise<void> {
    console.log(chalk.yellow('\n🔄 Rolling back changes...'));
    
    for (const change of appliedChanges) {
      if (change.success && change.backupPath) {
        try {
          const originalPath = path.join(process.cwd(), change.filePath);
          await fs.copy(change.backupPath, originalPath);
          console.log(chalk.green(`✓ Rolled back: ${change.filePath}`));
        } catch (error) {
          console.log(chalk.red(`✗ Failed to rollback: ${change.filePath}`));
        }
      }
    }
  }

  /**
   * Display a diff preview of changes
   */
  static displayChangePreview(changePlan: ChangePlan): void {
    console.log(chalk.blueBright('\n📋 Change Preview:'));
    console.log(chalk.cyan('─'.repeat(60)));
    
    console.log(chalk.bold('Summary:'), changePlan.summary);
    console.log(chalk.bold('Estimated Time:'), changePlan.estimatedTime);
    console.log(chalk.bold('Risk Level:'), this.getRiskLevelColor(changePlan.riskLevel));
    
    if (changePlan.changes.length === 0) {
      console.log(chalk.yellow('\nNo changes to apply.'));
      return;
    }

    console.log(chalk.bold(`\nFiles to modify (${changePlan.changes.length}):`));
    
    changePlan.changes.forEach((change, index) => {
      console.log(chalk.blueBright(`\n${index + 1}. ${change.filePath}`));
      console.log(chalk.gray(`   Confidence: ${Math.round(change.confidence * 100)}%`));
      console.log(chalk.gray(`   Description: ${change.description}`));
      
      // Show a preview of the change
      const lines = change.originalContent.split('\n');
      if (lines.length <= 3) {
        console.log(chalk.red(`   - ${change.originalContent}`));
        console.log(chalk.green(`   + ${change.newContent}`));
      } else {
        console.log(chalk.red(`   - ${lines[0]}...`));
        console.log(chalk.green(`   + ${change.newContent.split('\n')[0]}...`));
      }
    });
  }

  private static getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low':
        return chalk.green('LOW');
      case 'medium':
        return chalk.yellow('MEDIUM');
      case 'high':
        return chalk.red('HIGH');
      default:
        return chalk.gray('UNKNOWN');
    }
  }

  /**
   * Clean up old backups
   */
  static async cleanupOldBackups(projectRoot: string, keepLast: number = 5): Promise<void> {
    const backupDir = path.join(projectRoot, '.backups');
    
    if (!await fs.pathExists(backupDir)) {
      return;
    }

    const backups = await fs.readdir(backupDir);
    const backupPaths = backups
      .map(backup => path.join(backupDir, backup))
      .filter(backup => fs.statSync(backup).isDirectory())
      .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

    // Keep only the most recent backups
    for (let i = keepLast; i < backupPaths.length; i++) {
      await fs.remove(backupPaths[i]);
    }
  }
} 