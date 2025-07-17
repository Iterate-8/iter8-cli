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

// src/types/enquirer-input.d.ts

declare module 'enquirer/lib/prompts/input.js' {
  const Input: any;
  export default Input;
}

// Only for SIGINT handling
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to dynamically import Enquirer Input prompt
// @ts-expect-error: No type declaration for enquirer/lib/prompts/input.js
async function getInputPrompt() {
  const mod = await import('enquirer/lib/prompts/input.js');
  return mod.default || mod;
}

// Enquirer-based clean input box
async function askCommandBox(): Promise<string> {
  const Input = await getInputPrompt();
  const prompt = new Input({
    message: '',
    initial: '',
    prefix: '',
    style: 'default',
    validate: () => true
  });
  // Custom render for clean box with ">" prompt
  prompt.render = function () {
    const width = 60;
    this.stdout.write('\x1b[36m'); // Cyan border
    this.stdout.write('┌' + '─'.repeat(width) + '┐\n');
    this.stdout.write('│ ');
    this.stdout.write(chalk.whiteBright('> '));
    this.stdout.write(this.input);
    this.stdout.write(' '.repeat(width - 2 - this.input.length));
    this.stdout.write('│\n');
    this.stdout.write('└' + '─'.repeat(width) + '┘\n');
    this.stdout.write('\x1b[0m');
  };
  return await prompt.run();
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
  
  const startupName = await askCommandBox();
  return startupName.trim();
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

  const selection = await askCommandBox();
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
    
    const confirm = await askCommandBox();
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
    
    // Main command loop
    while (true) {
      console.log('\n');
      const command = await askCommandBox();
      
      switch (command.trim().toLowerCase()) {
        case 'refresh':
          const refreshSpinner = ora('Refreshing feedback...').start();
          try {
            const newFeedback = await SupabaseService.getFeedbackByStartup(startupName);
            refreshSpinner.succeed('Feedback refreshed!');
            displayFeedback(newFeedback);
            feedback = newFeedback; // Update the feedback array
          } catch (err) {
            refreshSpinner.fail('Failed to refresh feedback');
            logError(err);
          }
          break;
          
        case 'change':
          console.log(chalk.blueBright('\n🔄 Change Startup Name'));
          console.log(chalk.gray('Please enter your new startup name.\n'));
          const newStartupName = await askCommandBox();
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
              feedback = newFeedback; // Update the feedback array
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
          if (command.trim()) {
            console.log(chalk.yellow('Unknown command. Type "refresh", "change", "apply", or "quit".'));
          }
          break;
      }
    }
    
  } catch (err) {
    logError(err);
    rl.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.green('\n👋 Goodbye!'));
  rl.close();
  process.exit(0);
});

// Start the application
main(); 