import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CodeChange } from './openai.js';
import { logError } from '../utils/logger.js';

export interface FileBackup {
  filePath: string;
  originalContent: string;
  timestamp: string;
}

class FileManagerService {
  private backups: FileBackup[] = [];
  private backupDir = '.backups';

  async initialize(): Promise<void> {
    // Ensure backup directory exists
    await fs.ensureDir(this.backupDir);
  }

  async applyChanges(changes: CodeChange[]): Promise<void> {
    console.log(chalk.blue('📝 Applying changes to files...'));
    
    for (const change of changes) {
      try {
        // Create backup before modifying
        await this.createBackup(change.filePath);
        
        // Apply the change
        await this.applyChange(change);
        
        console.log(chalk.green(`✅ Applied: ${change.filePath}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to apply ${change.filePath}: ${error}`));
        logError(error);
      }
    }
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        const backup: FileBackup = {
          filePath,
          originalContent: content,
          timestamp: new Date().toISOString()
        };
        this.backups.push(backup);
        
        // Save backup to file
        const backupFileName = `${path.basename(filePath)}.${Date.now()}.backup`;
        const backupPath = path.join(this.backupDir, backupFileName);
        await fs.writeFile(backupPath, content);
      }
    } catch (error) {
      logError(`Failed to create backup for ${filePath}:`, error);
    }
  }

  private async applyChange(change: CodeChange): Promise<void> {
    const { filePath, content } = change;
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.ensureDir(dir);
    
    // Write the new content
    await fs.writeFile(filePath, content, 'utf8');
  }

  async revertChanges(): Promise<void> {
    if (this.backups.length === 0) {
      console.log(chalk.yellow('No changes to revert.'));
      return;
    }

    console.log(chalk.blue('🔄 Reverting changes...'));
    
    for (const backup of this.backups) {
      try {
        await fs.writeFile(backup.filePath, backup.originalContent, 'utf8');
        console.log(chalk.green(`✅ Reverted: ${backup.filePath}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to revert ${backup.filePath}: ${error}`));
        logError(error);
      }
    }
    
    this.backups = [];
    console.log(chalk.green('✅ All changes reverted successfully!'));
  }

  getBackupCount(): number {
    return this.backups.length;
  }

  async displayChanges(changes: CodeChange[]): Promise<void> {
    console.log(chalk.bold.yellow('📋 Generated Code Changes:'));
    console.log();
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      console.log(chalk.cyan(`${i + 1}. File: ${change.filePath}`));
      console.log(chalk.gray(`   Description: ${change.description}`));
      console.log(chalk.white('   Content:'));
      console.log(chalk.gray('   ┌────────────────────────────────────────┐'));
      
      // Display code with syntax highlighting
      const lines = change.content.split('\n');
      lines.forEach(line => {
        console.log(chalk.gray('   │ ') + chalk.white(line));
      });
      
      console.log(chalk.gray('   └────────────────────────────────────────┘'));
      console.log();
    }
  }
}

export const fileManagerService = new FileManagerService(); 