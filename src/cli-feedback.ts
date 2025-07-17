#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import readline from 'readline';
import { loadConfig, saveConfig } from './utils/config.js';
import { SupabaseService, Feedback } from './services/supabase.js';
import { AIService } from './services/ai.js';
import { CodeModifierService } from './services/codeModifier.js';
import { logInfo, logError } from './utils/logger.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      resolve(answer);
    });
  });
}

function drawInputBox() {
  const width = 50;
  console.log();
  process.stdout.write(chalk.cyan('┌' + '─'.repeat(width) + '┐') + '\n');
  process.stdout.write(chalk.cyan('│ ') + chalk.whiteBright('')); // Input prompt with left border
}

function displayFeedback(feedback: Feedback[]) {
  if (feedback.length === 0) {
    console.log(chalk.yellow('No feedback found for this startup.'));
    return;
  }

  console.log(chalk.blueBright(`\n📋 Feedback for ${chalk.bold(feedback[0].startup_name)}:`));
  console.log(chalk.cyan('─'.repeat(50)));
  
  feedback.forEach((item, index) => {
    console.log(chalk.green(`${index + 1}.`), chalk.whiteBright(item.feedback));
    console.log(chalk.gray(`   Date: ${new Date(item.created_at).toLocaleDateString()}`));
    console.log(''); // Empty line for spacing
  });
}

async function promptForStartupName(): Promise<string> {
  console.log(chalk.blueBright('\n🚀 Welcome to iter8-cli!'));
  console.log(chalk.gray('Please enter your startup name to view feedback.\n'));
  
  drawInputBox();
  const startupName = await question(chalk.cyan('Startup name: '));
  return startupName.trim();
}

async function main() {
  try {
    // Display banner
    const banner = figlet.textSync('Iter8', { horizontalLayout: 'default', verticalLayout: 'default' });
    console.log(chalk.magentaBright(banner));
    
    // Load existing config
    const config = await loadConfig();
    
    let startupName = config.startupName;
    
    // If no startup name is saved, prompt for it
    if (!startupName) {
      startupName = await promptForStartupName();
      
      if (!startupName) {
        console.log(chalk.red('Startup name cannot be empty.'));
        rl.close();
        process.exit(1);
      }
      
      // Save the startup name for future use
      await saveConfig({ ...config, startupName });
      console.log(chalk.green(`✓ Startup name "${startupName}" saved for future use.`));
    } else {
      console.log(chalk.blueBright(`\n👋 Welcome back! Using startup: ${chalk.bold(startupName)}`));
      console.log(chalk.gray('(You can change this by deleting the config.json file)'));
    }
    
    // Fetch and display feedback
    const spinner = ora('Fetching feedback from database...').start();
    
    let feedback: Feedback[] = [];
    
    try {
      feedback = await SupabaseService.getFeedbackByStartup(startupName);
      spinner.succeed('Feedback loaded successfully!');
      
      displayFeedback(feedback);
      
    } catch (err) {
      spinner.fail('Failed to fetch feedback');
      logError(err);
      rl.close();
      process.exit(1);
    }
    
    // Interactive loop for additional commands
    console.log(chalk.blueBright('\nCommands:'));
    console.log(chalk.gray('  refresh - Fetch latest feedback'));
    console.log(chalk.gray('  change  - Change startup name'));
    console.log(chalk.gray('  apply   - Apply feedback as code changes'));
    console.log(chalk.gray('  quit    - Exit the application'));
    
    while (true) {
      drawInputBox();
      const command = await question(chalk.cyan('> '));
      
      if (!command) {
        continue;
      }
      
      switch (command.trim().toLowerCase()) {
        case 'refresh':
          const refreshSpinner = ora('Refreshing feedback...').start();
          try {
            const newFeedback = await SupabaseService.getFeedbackByStartup(startupName);
            refreshSpinner.succeed('Feedback refreshed!');
            displayFeedback(newFeedback);
          } catch (err) {
            refreshSpinner.fail('Failed to refresh feedback');
            logError(err);
          }
          break;
          
        case 'change':
          console.log(chalk.blueBright('\n🔄 Change Startup Name'));
          console.log(chalk.gray('Please enter your new startup name.\n'));
          drawInputBox();
          const newStartupName = await question(chalk.cyan('New startup name: '));
          const trimmedNewStartupName = newStartupName.trim();
          if (trimmedNewStartupName) {
            startupName = trimmedNewStartupName;
            await saveConfig({ ...config, startupName });
            console.log(chalk.green(`✓ Startup name changed to "${startupName}"`));
            
            const changeSpinner = ora('Fetching feedback for new startup...').start();
            try {
              const newFeedback = await SupabaseService.getFeedbackByStartup(startupName);
              changeSpinner.succeed('Feedback loaded!');
              displayFeedback(newFeedback);
            } catch (err) {
              changeSpinner.fail('Failed to fetch feedback');
              logError(err);
            }
          }
          break;
          
        case 'apply':
          await handleApplyFeedback(feedback, startupName);
          break;
          
        case 'quit':
        case 'exit':
          console.log(chalk.green('\n👋 Goodbye!'));
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(chalk.yellow('Unknown command. Type "refresh", "change", "apply", or "quit".'));
          break;
      }
    }
    
  } catch (err) {
    logError(err);
    rl.close();
    process.exit(1);
  }
}

async function handleApplyFeedback(feedback: Feedback[], startupName: string) {
  if (feedback.length === 0) {
    console.log(chalk.yellow('No feedback available to apply.'));
    return;
  }

  console.log(chalk.blueBright('\n🤖 AI-Powered Code Modification'));
  console.log(chalk.gray('Select feedback to apply as code changes:\n'));

  // Display feedback with numbers
  feedback.forEach((item, index) => {
    console.log(chalk.blueBright(`${index + 1}.`), chalk.whiteBright(item.feedback));
    console.log(chalk.gray(`   Date: ${new Date(item.created_at).toLocaleDateString()}`));
    console.log('');
  });

  drawInputBox();
  const selection = await question(chalk.cyan('Enter feedback number to apply (or "cancel"): '));
  
  if (selection.trim().toLowerCase() === 'cancel') {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  const feedbackIndex = parseInt(selection) - 1;
  if (isNaN(feedbackIndex) || feedbackIndex < 0 || feedbackIndex >= feedback.length) {
    console.log(chalk.red('Invalid selection.'));
    return;
  }

  const selectedFeedback = feedback[feedbackIndex];
  
  console.log(chalk.blueBright('\n🔍 Analyzing feedback...'));
  const spinner = ora('Generating code changes...').start();

  try {
    // Analyze feedback and generate changes
    const changePlan = await AIService.analyzeFeedbackAndGenerateChanges(
      selectedFeedback.feedback,
      startupName
    );

    spinner.succeed('Analysis complete!');

    // Display change preview
    CodeModifierService.displayChangePreview(changePlan);

    if (changePlan.changes.length === 0) {
      console.log(chalk.yellow('\nNo changes to apply for this feedback.'));
      return;
    }

    // Ask for confirmation
    console.log(chalk.red('\n⚠️  WARNING: This will modify your codebase!'));
    console.log(chalk.gray('A backup will be created before applying changes.'));
    
    drawInputBox();
    const confirm = await question(chalk.cyan('Type "yes" to apply changes: '));

    if (confirm.trim().toLowerCase() !== 'yes') {
      console.log(chalk.yellow('Changes cancelled.'));
      return;
    }

    // Apply changes
    const applySpinner = ora('Applying changes...').start();
    const result = await CodeModifierService.applyChanges(changePlan);
    applySpinner.succeed('Changes applied successfully!');

    console.log(chalk.green(`\n✅ Successfully applied ${result.changes.filter(c => c.success).length} changes.`));
    console.log(chalk.gray(`Backup created at: ${result.backupDir}`));

    // Show results
    result.changes.forEach(change => {
      if (change.success) {
        console.log(chalk.green(`✓ ${change.filePath}`));
      } else {
        console.log(chalk.red(`✗ ${change.filePath}: ${change.error}`));
      }
    });

    // Clean up old backups
    await CodeModifierService.cleanupOldBackups(process.cwd());

  } catch (error) {
    spinner.fail('Failed to analyze feedback');
    logError(error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.green('\n👋 Goodbye!'));
  rl.close();
  process.exit(0);
});

// Ensure the process doesn't exit prematurely
process.stdin.resume();

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 