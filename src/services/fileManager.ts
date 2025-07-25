import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CodeChange } from './openai.js';
import { logError, logInfo } from '../utils/logger.js';

export interface FileBackup {
  filePath: string;
  originalContent: string;
  timestamp: string;
  id: string;
}

class FileManagerService {
  private backups: Map<string, FileBackup> = new Map();
  private backupDir = '.iter8_backups';
  private maxBackups = 100; // Prevent unlimited backup growth

  async initialize(): Promise<void> {
    try {
      // Ensure backup directory exists
      await fs.ensureDir(this.backupDir);
      
      // Load existing backups from disk
      await this.loadBackupsFromDisk();
      
      logInfo(`File manager initialized with ${this.backups.size} existing backups`);
    } catch (error) {
      logError(`Failed to initialize file manager: ${error}`);
      throw error;
    }
  }

  async applyChanges(changes: CodeChange[]): Promise<void> {
    if (!changes || changes.length === 0) {
      logInfo('No changes to apply');
      return;
    }

    console.log(chalk.blue(`📝 Applying ${changes.length} changes to files...`));
    
    let successful = 0;
    let failed = 0;

    for (const change of changes) {
      try {
        // Validate the change
        this.validateChange(change);
        
        // Create backup before modifying
        await this.createBackup(change.filePath);
        
        // Apply the change
        await this.applyChange(change);
        
        successful++;
        console.log(chalk.green(`✅ Applied: ${change.filePath}`));
      } catch (error) {
        failed++;
        console.log(chalk.red(`❌ Failed to apply ${change.filePath}: ${error}`));
        logError(error);
      }
    }

    const summary = `Applied ${successful} changes successfully${failed > 0 ? `, ${failed} failed` : ''}`;
    console.log(chalk.blue(summary));
    
    if (failed > 0) {
      console.log(chalk.yellow('Some changes failed. Use "revert" command to undo successful changes if needed.'));
    }
  }

  private validateChange(change: CodeChange): void {
    if (!change.filePath || typeof change.filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    
    if (typeof change.content !== 'string') {
      throw new Error('Invalid content - must be string');
    }

    // Check for potentially dangerous file paths
    const normalizedPath = path.normalize(change.filePath);
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      throw new Error(`Potentially unsafe file path: ${change.filePath}`);
    }

    // Warn about large files
    if (change.content.length > 100000) { // 100KB
      console.log(chalk.yellow(`⚠ Large file detected: ${change.filePath} (${change.content.length} characters)`));
    }
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupId = `${filePath}-${Date.now()}`;
      
      // Check if we've hit the backup limit
      if (this.backups.size >= this.maxBackups) {
        await this.cleanupOldBackups();
      }

      let originalContent = '';
      if (await fs.pathExists(filePath)) {
        originalContent = await fs.readFile(filePath, 'utf8');
      }

      const backup: FileBackup = {
        filePath,
        originalContent,
        timestamp: new Date().toISOString(),
        id: backupId
      };

      // Store in memory
      this.backups.set(backupId, backup);
      
      // Save backup to disk
      const backupFileName = `${path.basename(filePath)}-${Date.now()}.backup`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      const backupData = {
        ...backup,
        content: originalContent
      };
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      logInfo(`Created backup: ${backupId}`);
    } catch (error) {
      logError(`Failed to create backup for ${filePath}: ${error}`);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupArray = Array.from(this.backups.values());
      backupArray.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Remove oldest 20% of backups
      const toRemove = Math.floor(backupArray.length * 0.2);
      
      for (let i = 0; i < toRemove; i++) {
        const backup = backupArray[i];
        this.backups.delete(backup.id);
        
        // Try to remove from disk
        try {
          const backupFiles = await fs.readdir(this.backupDir);
          const matchingFile = backupFiles.find(f => f.includes(backup.id));
          if (matchingFile) {
            await fs.remove(path.join(this.backupDir, matchingFile));
          }
        } catch (diskError) {
          // Non-critical error
          logError(`Failed to remove backup file: ${diskError}`);
        }
      }
      
      logInfo(`Cleaned up ${toRemove} old backups`);
    } catch (error) {
      logError(`Failed to cleanup old backups: ${error}`);
    }
  }

  private async loadBackupsFromDisk(): Promise<void> {
    try {
      if (!(await fs.pathExists(this.backupDir))) {
        return;
      }

      const backupFiles = await fs.readdir(this.backupDir);
      
      for (const file of backupFiles) {
        if (!file.endsWith('.backup')) continue;
        
        try {
          const backupPath = path.join(this.backupDir, file);
          const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
          
          if (backupData.id && backupData.filePath) {
            this.backups.set(backupData.id, {
              id: backupData.id,
              filePath: backupData.filePath,
              originalContent: backupData.content || '',
              timestamp: backupData.timestamp || new Date().toISOString()
            });
          }
        } catch (fileError) {
          logError(`Failed to load backup file ${file}: ${fileError}`);
        }
      }
    } catch (error) {
      logError(`Failed to load backups from disk: ${error}`);
    }
  }

  private async applyChange(change: CodeChange): Promise<void> {
    const { filePath, content } = change;
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);
      
      // Write the new content
      await fs.writeFile(filePath, content, 'utf8');
      
      logInfo(`Successfully wrote ${content.length} characters to ${filePath}`);
    } catch (error) {
      logError(`Failed to write file ${filePath}: ${error}`);
      throw error;
    }
  }

  async revertChanges(count?: number): Promise<void> {
    if (this.backups.size === 0) {
      console.log(chalk.yellow('No changes to revert.'));
      return;
    }

    const backupArray = Array.from(this.backups.values());
    backupArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const toRevert = count ? backupArray.slice(0, count) : backupArray;

    console.log(chalk.blue(`🔄 Reverting ${toRevert.length} changes...`));
    
    let reverted = 0;
    let failed = 0;

    for (const backup of toRevert) {
      try {
        if (backup.originalContent) {
          // File existed, restore original content
          const dir = path.dirname(backup.filePath);
          await fs.ensureDir(dir);
          await fs.writeFile(backup.filePath, backup.originalContent, 'utf8');
        } else {
          // File didn't exist, remove it
          if (await fs.pathExists(backup.filePath)) {
            await fs.remove(backup.filePath);
          }
        }
        
        console.log(chalk.green(`✅ Reverted: ${backup.filePath}`));
        
        // Remove from backups
        this.backups.delete(backup.id);
        reverted++;
      } catch (error) {
        console.log(chalk.red(`❌ Failed to revert ${backup.filePath}: ${error}`));
        logError(error);
        failed++;
      }
    }
    
    console.log(chalk.green(`✅ Reverted ${reverted} changes successfully${failed > 0 ? `, ${failed} failed` : ''}!`));
  }

  getBackupCount(): number {
    return this.backups.size;
  }

  getRecentBackups(count = 5): FileBackup[] {
    const backupArray = Array.from(this.backups.values());
    backupArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return backupArray.slice(0, count);
  }

  async displayChanges(changes: CodeChange[]): Promise<void> {
    console.log(chalk.bold.yellow('\n📋 Generated Code Changes:'));
    console.log();
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      console.log(chalk.cyan(`${i + 1}. File: ${change.filePath}`));
      console.log(chalk.gray(`   Description: ${change.description || 'No description provided'}`));
      
      // Show file size info
      const sizeKB = Math.round(change.content.length / 1024 * 100) / 100;
      console.log(chalk.gray(`   Size: ${change.content.length} characters (${sizeKB} KB)`));
      
      // Show first few lines as preview
      const lines = change.content.split('\n');
      const preview = lines.slice(0, 5);
      
      console.log(chalk.white('   Preview:'));
      console.log(chalk.gray('   ┌────────────────────────────────────────┐'));
      
      preview.forEach(line => {
        const truncated = line.length > 50 ? line.substring(0, 47) + '...' : line;
        console.log(chalk.gray('   │ ') + chalk.white(truncated.padEnd(50)) + chalk.gray(' │'));
      });
      
      if (lines.length > 5) {
        console.log(chalk.gray(`   │ ... (${lines.length - 5} more lines)`) + ' '.repeat(50 - `... (${lines.length - 5} more lines)`.length) + chalk.gray(' │'));
      }
      
      console.log(chalk.gray('   └────────────────────────────────────────┘'));
      console.log();
    }
  }

  // Public method to read a file's contents
  public async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      logError(`Failed to read file ${filePath}: ${error}`);
      throw error;
    }
  }

  // Public method to write content to a file (ensures directory exists)
  public async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);
      await fs.writeFile(filePath, content, 'utf8');
      logInfo(`Wrote ${content.length} characters to ${filePath}`);
    } catch (error) {
      logError(`Failed to write file ${filePath}: ${error}`);
      throw error;
    }
  }

  // Check if a file exists
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      logError(`Failed to check if file exists ${filePath}: ${error}`);
      return false;
    }
  }

  // Get file stats
  public async getFileStats(): Promise<{ totalFiles: number; recentBackups: FileBackup[] }> {
    return {
      totalFiles: this.backups.size,
      recentBackups: this.getRecentBackups(3)
    };
  }
}

export const fileManagerService = new FileManagerService();