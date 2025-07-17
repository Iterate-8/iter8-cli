#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import { loadConfig } from './utils/config.js';
import { logInfo, logError } from './utils/logger.js';
import { fetchData } from './utils/http.js';
import { createTicketsCommand } from './commands/tickets.js';
import { createDebugCommand } from './commands/debug.js';
import readline from 'readline';
import { supabaseService } from './services/supabase.js';
import { openAIService } from './services/openai.js';
import { fileManagerService } from './services/fileManager.js';
const program = new Command();
program
    .name('iter8-cli')
    .description('CLI Tool for Iter8 customers')
    .version('1.0.0');
// Add tickets command
program.addCommand(createTicketsCommand());
// Add debug command
program.addCommand(createDebugCommand());
program
    .command('hello')
    .description('Print hello message')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const spinner = ora('Processing...').start();
    try {
        spinner.text = 'Loading config...';
        const config = yield loadConfig();
        spinner.text = 'Saying hello...';
        logInfo(`Hello, ${chalk.green(config.user || 'World')}!`);
        spinner.succeed('Done!');
    }
    catch (err) {
        spinner.fail('Error occurred');
        logError(err);
    }
}));
program
    .command('fetch <url>')
    .description('Fetch data from a URL')
    .action((url) => __awaiter(void 0, void 0, void 0, function* () {
    const spinner = ora(`Fetching ${url}...`).start();
    try {
        const data = yield fetchData(url);
        spinner.succeed('Fetched successfully!');
        logInfo(chalk.blueBright(JSON.stringify(data, null, 2)));
    }
    catch (err) {
        spinner.fail('Failed to fetch');
        logError(err);
    }
}));
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Render "Iter8" banner in color
    const banner = figlet.textSync('Iter8', { horizontalLayout: 'default', verticalLayout: 'default' });
    console.log(chalk.magentaBright(banner));
    // Load config and prompt for startup name if not set
    let config = yield loadConfig();
    let startupName = process.env.STARTUP_NAME || config.user;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    function askStartupName() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                rl.question(chalk.cyan('Enter your startup name: '), (answer) => {
                    resolve(answer.trim());
                });
            });
        });
    }
    if (!startupName) {
        startupName = yield askStartupName();
        config.user = startupName;
        yield import('./utils/config.js').then(m => m.saveConfig(config));
    }
    // Initialize services and fetch feedback for this startup
    let todos = [];
    try {
        if (!config.supabase) {
            throw new Error('Supabase not configured');
        }
        yield supabaseService.initialize(config.supabase);
        yield openAIService.initialize();
        yield fileManagerService.initialize();
        if (startupName) {
            const feedbackItems = yield supabaseService.getFeedbackByStartupName(startupName);
            todos = feedbackItems;
        }
    }
    catch (err) {
        logError(err);
    }
    // Show the to-do list
    console.log();
    console.log(chalk.bold.blueBright('TODOS').padEnd(30, ' '));
    if (todos.length > 0) {
        todos.forEach((todo, idx) => {
            console.log(chalk.blueBright(`${idx + 1}. `) + chalk.whiteBright(todo));
        });
    }
    else {
        console.log(chalk.gray('No feedback found for this startup.'));
    }
    console.log();
    // Show commands
    console.log(chalk.bold.cyan('Commands:'));
    console.log(chalk.white('  refresh - Fetch latest feedback'));
    console.log(chalk.white('  change  - Change startup name'));
    console.log(chalk.white('  apply   - Apply feedback as code changes'));
    console.log(chalk.white('  revert  - Revert applied changes'));
    console.log(chalk.white('  quit    - Exit the application'));
    console.log();
    // Claude Code style: single top line, input below
    function drawClaudeInputBox() {
        const width = 40;
        // Draw only the top line
        console.log();
        process.stdout.write(chalk.cyan('┌' + '─'.repeat(width) + '┐') + '\n');
        // Input prompt below the line
        process.stdout.write(chalk.whiteBright('')); // No prefix, just input
    }
    function prompt() {
        drawClaudeInputBox();
        rl.question('', (answer) => {
            const input = answer.trim().toLowerCase();
            if (input === 'quit') {
                console.log(chalk.green('Goodbye!'));
                rl.close();
                process.exit(0);
            }
            else if (input === 'refresh') {
                refreshFeedback();
            }
            else if (input === 'change') {
                changeStartupName();
            }
            else if (input === 'apply') {
                applyFeedback();
            }
            else if (input === 'revert') {
                revertChanges();
            }
            else {
                console.log(chalk.yellow('Unknown command. Type one of: refresh, change, apply, revert, quit'));
                prompt();
            }
        });
    }
    function refreshFeedback() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.blue('🔄 Fetching latest feedback...'));
            try {
                if (startupName) {
                    const feedbackItems = yield supabaseService.getFeedbackByStartupName(startupName);
                    todos = feedbackItems;
                }
                console.log(chalk.green('✅ Feedback refreshed!'));
                console.log();
                console.log(chalk.bold.blueBright('TODOS').padEnd(30, ' '));
                if (todos.length > 0) {
                    todos.forEach((todo, idx) => {
                        console.log(chalk.blueBright(`${idx + 1}. `) + chalk.whiteBright(todo));
                    });
                }
                else {
                    console.log(chalk.gray('No feedback found for this startup.'));
                }
                console.log();
            }
            catch (err) {
                console.log(chalk.red('❌ Failed to refresh feedback'));
                logError(err);
            }
            prompt();
        });
    }
    function changeStartupName() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.blue('🔄 Changing startup name...'));
            const newStartupName = yield askStartupName();
            startupName = newStartupName;
            config.user = startupName;
            yield import('./utils/config.js').then(m => m.saveConfig(config));
            console.log(chalk.green(`✅ Startup name changed to: ${startupName}`));
            yield refreshFeedback();
        });
    }
    function applyFeedback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (todos.length === 0) {
                console.log(chalk.yellow('No todos to apply.'));
                prompt();
                return;
            }
            console.log(chalk.blue('📋 Select todos to apply:'));
            console.log(chalk.gray('(Enter numbers separated by commas, or "all" or "cancel")'));
            console.log();
            // Display todos as selectable options
            console.log(chalk.cyan('Available options:'));
            todos.forEach((todo, idx) => {
                console.log(chalk.white(`  ${idx + 1}. ${todo}`));
            });
            console.log(chalk.white('  all - Apply all todos'));
            console.log(chalk.white('  cancel - Cancel selection'));
            console.log();
            drawClaudeInputBox();
            rl.question('', (selection) => {
                const input = selection.trim().toLowerCase();
                if (input === 'cancel') {
                    console.log(chalk.yellow('Selection cancelled.'));
                    prompt();
                }
                else if (input === 'all') {
                    applySelectedTodos(todos.map((_, idx) => idx));
                }
                else {
                    // Parse comma-separated numbers
                    const numbers = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= todos.length);
                    if (numbers.length > 0) {
                        applySelectedTodos(numbers.map(n => n - 1)); // Convert to 0-based index
                    }
                    else {
                        console.log(chalk.red('Invalid selection. Please enter valid numbers or "all".'));
                        prompt();
                    }
                }
            });
        });
    }
    function applySelectedTodos(selectedIndices) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.green('🚀 Generating code changes for selected todos...'));
            try {
                // Generate changes for each selected todo using OpenAI
                const allChanges = [];
                for (const index of selectedIndices) {
                    const todo = todos[index];
                    console.log(chalk.blue(`Generating changes for: ${todo}`));
                    const generatedChanges = yield openAIService.generateCodeChanges(todo);
                    allChanges.push(...generatedChanges.changes);
                }
                console.log(chalk.green(`✅ Generated ${allChanges.length} code change(s)`));
                console.log();
                // Display the generated changes
                yield fileManagerService.displayChanges(allChanges);
                // Ask for confirmation
                console.log(chalk.cyan('Do you want to apply these changes?'));
                console.log(chalk.white('  accept - Apply all changes'));
                console.log(chalk.white('  deny   - Cancel all changes'));
                console.log(chalk.white('  modify - Edit changes before applying'));
                console.log();
                drawClaudeInputBox();
                rl.question('', (response) => __awaiter(this, void 0, void 0, function* () {
                    const input = response.trim().toLowerCase();
                    if (input === 'accept') {
                        // Apply the changes
                        console.log(chalk.green('✅ Applying changes to files...'));
                        yield fileManagerService.applyChanges(allChanges);
                        // Log the execution
                        const timestamp = new Date().toISOString();
                        selectedIndices.forEach(index => {
                            const todo = todos[index];
                            const logEntry = `[${timestamp}] Applied todo #${index + 1}: ${todo}\n`;
                            import('fs').then(fs => {
                                fs.appendFileSync('execution_log.txt', logEntry);
                            }).catch(err => {
                                console.log(chalk.red('Failed to log execution'));
                            });
                        });
                        console.log(chalk.blue('📝 Actions logged to execution_log.txt'));
                        redisplayTodosAndCommands();
                    }
                    else if (input === 'deny') {
                        console.log(chalk.yellow('❌ Changes cancelled.'));
                        redisplayTodosAndCommands();
                    }
                    else if (input === 'modify') {
                        console.log(chalk.blue('🔧 Modification feature coming soon...'));
                        redisplayTodosAndCommands();
                    }
                    else {
                        console.log(chalk.red('Invalid response. Please enter: accept, deny, or modify'));
                        prompt();
                    }
                }));
            }
            catch (error) {
                console.log(chalk.red('❌ Failed to generate changes:'));
                logError(error);
                redisplayTodosAndCommands();
            }
        });
    }
    function revertChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const backupCount = fileManagerService.getBackupCount();
            if (backupCount === 0) {
                console.log(chalk.yellow('No changes to revert.'));
                prompt();
                return;
            }
            console.log(chalk.blue(`🔄 Reverting ${backupCount} change(s)...`));
            yield fileManagerService.revertChanges();
            redisplayTodosAndCommands();
        });
    }
    function redisplayTodosAndCommands() {
        console.log();
        console.log(chalk.bold.blueBright('TODOS').padEnd(30, ' '));
        if (todos.length > 0) {
            todos.forEach((todo, idx) => {
                console.log(chalk.blueBright(`${idx + 1}. `) + chalk.whiteBright(todo));
            });
        }
        else {
            console.log(chalk.gray('No feedback found for this startup.'));
        }
        console.log();
        // Show commands
        console.log(chalk.bold.cyan('Commands:'));
        console.log(chalk.white('  refresh - Fetch latest feedback'));
        console.log(chalk.white('  change  - Change startup name'));
        console.log(chalk.white('  apply   - Apply feedback as code changes'));
        console.log(chalk.white('  revert  - Revert applied changes'));
        console.log(chalk.white('  quit    - Exit the application'));
        console.log();
        prompt();
    }
    function executeTodo(index) {
        const todo = todos[index];
        console.log(chalk.green(`Executing: ${todo}`));
        // Create a log file to show execution
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Executed todo #${index + 1}: ${todo}\n`;
        // Write to execution log file
        import('fs').then(fs => {
            fs.appendFileSync('execution_log.txt', logEntry);
            console.log(chalk.blue(`✅ Action logged to execution_log.txt`));
            console.log(chalk.gray(`Log entry: ${logEntry.trim()}`));
        }).catch(err => {
            console.log(chalk.red('Failed to log execution'));
        });
        prompt();
    }
    prompt();
    // Don't parse command line arguments - stay in interactive mode
    // await program.parseAsync(process.argv);
}))();
// If using Ink, entry point should be cli.tsx
