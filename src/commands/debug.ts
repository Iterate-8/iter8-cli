import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../utils/config.js';
import { logInfo, logError } from '../utils/logger.js';
import { supabaseService } from '../services/supabase.js';

export function createDebugCommand(): Command {
  const debugCommand = new Command('debug')
    .description('Debug Supabase connection and permissions');

  debugCommand
    .command('test-connection')
    .description('Test Supabase connection and permissions')
    .action(async () => {
      const spinner = ora('Testing connection...').start();
      try {
        const config = await loadConfig();
        if (!config.supabase) {
          spinner.fail('Supabase not configured');
          return;
        }

        await supabaseService.initialize(config.supabase);
        
        // Test 1: Basic connection
        spinner.text = 'Testing basic connection...';
        console.log(chalk.green('✅ Connection successful'));
        
        // Test 2: Try to read from feedback table
        spinner.text = 'Testing feedback table access...';
        const { data, error } = await supabaseService.client!.from('feedback').select('*').limit(5);
        
        if (error) {
          console.log(chalk.red('❌ Error accessing feedback table:'));
          console.log(chalk.yellow(error.message));
          
          if (error.message.includes('permission denied')) {
            console.log(chalk.blue('\n🔧 This is likely a Row Level Security (RLS) issue.'));
            console.log(chalk.blue('To fix this, you need to:'));
            console.log(chalk.blue('1. Go to your Supabase dashboard'));
            console.log(chalk.blue('2. Navigate to Authentication > Policies'));
            console.log(chalk.blue('3. Create a policy for the feedback table to allow anonymous read access'));
            console.log(chalk.blue('4. Or disable RLS on the feedback table'));
          }
        } else {
          console.log(chalk.green('✅ Feedback table accessible'));
          console.log(chalk.blue(`Found ${data?.length || 0} records`));
          
          if (data && data.length > 0) {
            console.log(chalk.blue('\n📋 Sample record structure:'));
            console.log(chalk.gray(JSON.stringify(data[0], null, 2)));
          }
        }
        
        // Test 3: Check table count
        spinner.text = 'Checking table count...';
        const { count, error: countError } = await supabaseService.client!.from('feedback').select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log(chalk.red('❌ Error getting count:'));
          console.log(chalk.yellow(countError.message));
        } else {
          console.log(chalk.green(`✅ Total records in feedback table: ${count || 0}`));
        }
        
        spinner.succeed('Debug test completed');
      } catch (err) {
        spinner.fail('Debug test failed');
        logError(err);
      }
    });

  return debugCommand;
} 