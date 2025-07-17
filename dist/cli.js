#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const http_1 = require("./utils/http");
const tickets_1 = require("./commands/tickets");
const debug_1 = require("./commands/debug");
const readline_1 = __importDefault(require("readline"));
const supabase_1 = require("./services/supabase");
const openai_1 = require("./services/openai");
const fileManager_1 = require("./services/fileManager");
const program = new commander_1.Command();
program
    .name('iter8-cli')
    .description('CLI Tool for Iter8 customers')
    .version('1.0.0');
// Add tickets command
program.addCommand((0, tickets_1.createTicketsCommand)());
// Add debug command
program.addCommand((0, debug_1.createDebugCommand)());
program
    .command('hello')
    .description('Print hello message')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        spinner.text = 'Loading config...';
        const config = yield (0, config_1.loadConfig)();
        spinner.text = 'Saying hello...';
        (0, logger_1.logInfo)(`Hello, ${chalk_1.default.green(config.user || 'World')}!`);
        spinner.succeed('Done!');
    }
    catch (err) {
        spinner.fail('Error occurred');
        (0, logger_1.logError)(err);
    }
}));
program
    .command('fetch <url>')
    .description('Fetch data from a URL')
    .action((url) => __awaiter(void 0, void 0, void 0, function* () {
    const spinner = (0, ora_1.default)(`Fetching ${url}...`).start();
    try {
        const data = yield (0, http_1.fetchData)(url);
        spinner.succeed('Fetched successfully!');
        (0, logger_1.logInfo)(chalk_1.default.blueBright(JSON.stringify(data, null, 2)));
    }
    catch (err) {
        spinner.fail('Failed to fetch');
        (0, logger_1.logError)(err);
    }
}));
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Display ASCII banner
    console.log(chalk_1.default.magentaBright(`
  ╔══════════════════════════════════════╗
  ║             ITER8 CLI                ║
  ╚══════════════════════════════════════╝
  `));
    // Load config and prompt for startup name if not set
    let config = yield (0, config_1.loadConfig)();
    let startupName = process.env.STARTUP_NAME || config.user;
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    function askStartupName() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                rl.question(chalk_1.default.cyan('Enter your startup name: '), (answer) => {
                    resolve(answer.trim());
                });
            });
        });
    }
    if (!startupName) {
        startupName = yield askStartupName();
        config.user = startupName;
        yield Promise.resolve().then(() => __importStar(require('./utils/config.js'))).then(m => m.saveConfig(config));
    }
    // Initialize services and fetch feedback for this startup
    let todos = [];
    try {
        if (!config.supabase) {
            throw new Error('Supabase not configured');
        }
        yield supabase_1.supabaseService.initialize(config.supabase);
        yield openai_1.openAIService.initialize();
        yield fileManager_1.fileManagerService.initialize();
        if (startupName) {
            const feedbackItems = yield supabase_1.supabaseService.getFeedbackByStartupName(startupName);
            todos = feedbackItems;
        }
    }
    catch (err) {
        (0, logger_1.logError)(err);
    }
    // Show the to-do list
    console.log();
    console.log(chalk_1.default.bold.blueBright('TODOS').padEnd(30, ' '));
    if (todos.length > 0) {
        todos.forEach((todo, idx) => {
            console.log(chalk_1.default.blueBright(`${idx + 1}. `) + chalk_1.default.whiteBright(todo));
        });
    }
    else {
        console.log(chalk_1.default.gray('No feedback found for this startup.'));
    }
    console.log();
    // Show commands
    console.log(chalk_1.default.bold.cyan('Commands:'));
    console.log(chalk_1.default.white('  refresh - Fetch latest feedback'));
    console.log(chalk_1.default.white('  change  - Change startup name'));
    console.log(chalk_1.default.white('  apply   - Apply feedback as code changes'));
    console.log(chalk_1.default.white('  revert  - Revert applied changes'));
    console.log(chalk_1.default.white('  quit    - Exit the application'));
    console.log();
    // Claude Code style: single top line, input below
    function drawClaudeInputBox() {
        const width = 40;
        // Draw only the top line
        console.log();
        process.stdout.write(chalk_1.default.cyan('┌' + '─'.repeat(width) + '┐') + '\n');
        // Input prompt below the line
        process.stdout.write(chalk_1.default.whiteBright('')); // No prefix, just input
    }
    function prompt() {
        drawClaudeInputBox();
        rl.question('', (answer) => {
            const input = answer.trim().toLowerCase();
            if (input === 'quit') {
                console.log(chalk_1.default.green('Goodbye!'));
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
                console.log(chalk_1.default.yellow('Unknown command. Type one of: refresh, change, apply, revert, quit'));
                prompt();
            }
        });
    }
    function refreshFeedback() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.blue('🔄 Fetching latest feedback...'));
            try {
                if (startupName) {
                    const feedbackItems = yield supabase_1.supabaseService.getFeedbackByStartupName(startupName);
                    todos = feedbackItems;
                }
                console.log(chalk_1.default.green('✅ Feedback refreshed!'));
                console.log();
                console.log(chalk_1.default.bold.blueBright('TODOS').padEnd(30, ' '));
                if (todos.length > 0) {
                    todos.forEach((todo, idx) => {
                        console.log(chalk_1.default.blueBright(`${idx + 1}. `) + chalk_1.default.whiteBright(todo));
                    });
                }
                else {
                    console.log(chalk_1.default.gray('No feedback found for this startup.'));
                }
                console.log();
            }
            catch (err) {
                console.log(chalk_1.default.red('❌ Failed to refresh feedback'));
                (0, logger_1.logError)(err);
            }
            prompt();
        });
    }
    function changeStartupName() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.blue('🔄 Changing startup name...'));
            const newStartupName = yield askStartupName();
            startupName = newStartupName;
            config.user = startupName;
            yield Promise.resolve().then(() => __importStar(require('./utils/config.js'))).then(m => m.saveConfig(config));
            console.log(chalk_1.default.green(`✅ Startup name changed to: ${startupName}`));
            yield refreshFeedback();
        });
    }
    function applyFeedback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (todos.length === 0) {
                console.log(chalk_1.default.yellow('No todos to apply.'));
                prompt();
                return;
            }
            console.log(chalk_1.default.blue('📋 Select todos to apply:'));
            console.log(chalk_1.default.gray('(Enter numbers separated by commas, or "all" or "cancel")'));
            console.log();
            // Display todos as selectable options
            console.log(chalk_1.default.cyan('Available options:'));
            todos.forEach((todo, idx) => {
                console.log(chalk_1.default.white(`  ${idx + 1}. ${todo}`));
            });
            console.log(chalk_1.default.white('  all - Apply all todos'));
            console.log(chalk_1.default.white('  cancel - Cancel selection'));
            console.log();
            drawClaudeInputBox();
            rl.question('', (selection) => {
                const input = selection.trim().toLowerCase();
                if (input === 'cancel') {
                    console.log(chalk_1.default.yellow('Selection cancelled.'));
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
                        console.log(chalk_1.default.red('Invalid selection. Please enter valid numbers or "all".'));
                        prompt();
                    }
                }
            });
        });
    }
    function applySelectedTodos(selectedIndices) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.green('🚀 Generating code changes for selected todos...'));
            try {
                // Generate changes for each selected todo using OpenAI
                const allChanges = [];
                for (const index of selectedIndices) {
                    const todo = todos[index];
                    console.log(chalk_1.default.blue(`Generating changes for: ${todo}`));
                    const generatedChanges = yield openai_1.openAIService.generateCodeChanges(todo);
                    allChanges.push(...generatedChanges.changes);
                }
                console.log(chalk_1.default.green(`✅ Generated ${allChanges.length} code change(s)`));
                console.log();
                // Display the generated changes
                yield fileManager_1.fileManagerService.displayChanges(allChanges);
                // Ask for confirmation
                console.log(chalk_1.default.cyan('Do you want to apply these changes?'));
                console.log(chalk_1.default.white('  accept - Apply all changes'));
                console.log(chalk_1.default.white('  deny   - Cancel all changes'));
                console.log(chalk_1.default.white('  modify - Edit changes before applying'));
                console.log();
                drawClaudeInputBox();
                rl.question('', (response) => __awaiter(this, void 0, void 0, function* () {
                    const input = response.trim().toLowerCase();
                    if (input === 'accept') {
                        // Apply the changes
                        console.log(chalk_1.default.green('✅ Applying changes to files...'));
                        yield fileManager_1.fileManagerService.applyChanges(allChanges);
                        // Log the execution
                        const timestamp = new Date().toISOString();
                        selectedIndices.forEach(index => {
                            const todo = todos[index];
                            const logEntry = `[${timestamp}] Applied todo #${index + 1}: ${todo}\n`;
                            Promise.resolve().then(() => __importStar(require('fs'))).then(fs => {
                                fs.appendFileSync('execution_log.txt', logEntry);
                            }).catch(err => {
                                console.log(chalk_1.default.red('Failed to log execution'));
                            });
                        });
                        console.log(chalk_1.default.blue('📝 Actions logged to execution_log.txt'));
                        redisplayTodosAndCommands();
                    }
                    else if (input === 'deny') {
                        console.log(chalk_1.default.yellow('❌ Changes cancelled.'));
                        redisplayTodosAndCommands();
                    }
                    else if (input === 'modify') {
                        console.log(chalk_1.default.blue('🔧 Modification feature coming soon...'));
                        redisplayTodosAndCommands();
                    }
                    else {
                        console.log(chalk_1.default.red('Invalid response. Please enter: accept, deny, or modify'));
                        prompt();
                    }
                }));
            }
            catch (error) {
                console.log(chalk_1.default.red('❌ Failed to generate changes:'));
                (0, logger_1.logError)(error);
                redisplayTodosAndCommands();
            }
        });
    }
    function revertChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const backupCount = fileManager_1.fileManagerService.getBackupCount();
            if (backupCount === 0) {
                console.log(chalk_1.default.yellow('No changes to revert.'));
                prompt();
                return;
            }
            console.log(chalk_1.default.blue(`🔄 Reverting ${backupCount} change(s)...`));
            yield fileManager_1.fileManagerService.revertChanges();
            redisplayTodosAndCommands();
        });
    }
    function redisplayTodosAndCommands() {
        console.log();
        console.log(chalk_1.default.bold.blueBright('TODOS').padEnd(30, ' '));
        if (todos.length > 0) {
            todos.forEach((todo, idx) => {
                console.log(chalk_1.default.blueBright(`${idx + 1}. `) + chalk_1.default.whiteBright(todo));
            });
        }
        else {
            console.log(chalk_1.default.gray('No feedback found for this startup.'));
        }
        console.log();
        // Show commands
        console.log(chalk_1.default.bold.cyan('Commands:'));
        console.log(chalk_1.default.white('  refresh - Fetch latest feedback'));
        console.log(chalk_1.default.white('  change  - Change startup name'));
        console.log(chalk_1.default.white('  apply   - Apply feedback as code changes'));
        console.log(chalk_1.default.white('  revert  - Revert applied changes'));
        console.log(chalk_1.default.white('  quit    - Exit the application'));
        console.log();
        prompt();
    }
    function executeTodo(index) {
        const todo = todos[index];
        console.log(chalk_1.default.green(`Executing: ${todo}`));
        // Create a log file to show execution
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Executed todo #${index + 1}: ${todo}\n`;
        // Write to execution log file
        Promise.resolve().then(() => __importStar(require('fs'))).then(fs => {
            fs.appendFileSync('execution_log.txt', logEntry);
            console.log(chalk_1.default.blue(`✅ Action logged to execution_log.txt`));
            console.log(chalk_1.default.gray(`Log entry: ${logEntry.trim()}`));
        }).catch(err => {
            console.log(chalk_1.default.red('Failed to log execution'));
        });
        prompt();
    }
    prompt();
    // Don't parse command line arguments - stay in interactive mode
    // await program.parseAsync(process.argv);
}))();
// If using Ink, entry point should be cli.tsx
