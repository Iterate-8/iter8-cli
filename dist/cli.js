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
import readline from 'readline';
const program = new Command();
program
    .name('tscli')
    .description('A TypeScript CLI app foundation')
    .version('1.0.0');
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
    // Mocked Todos List (title bold, todos normal)
    const todos = [
        'Set up authentication flow',
        'Implement user profile page',
        'Integrate payment gateway',
        'Write unit and integration tests',
        'Configure CI/CD pipeline',
        'Optimize app performance',
        'Add error tracking and logging',
        'Prepare production deployment scripts'
    ];
    console.log();
    console.log(chalk.bold.blueBright('TODOS').padEnd(30, ' '));
    todos.forEach(todo => {
        console.log(chalk.blueBright('• ') + chalk.whiteBright(todo));
    });
    console.log();
    // Prompt for user command with a styled input box
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    function drawInputBox() {
        const width = 40;
        const top = '┌' + '─'.repeat(width) + '┐';
        const mid = '│' + ' '.repeat(width) + '│';
        const bot = '└' + '─'.repeat(width) + '┘';
        console.log(chalk.cyan(top));
        console.log(chalk.cyan(mid));
        process.stdout.write(chalk.cyan('│ ') + chalk.whiteBright.bold('Enter a command (type "quit" to exit):').padEnd(width - 1, ' ') + chalk.cyan('│\n'));
        console.log(chalk.cyan(bot));
        process.stdout.write(chalk.cyan('> '));
    }
    function prompt() {
        drawInputBox();
        rl.question('', (answer) => {
            if (answer.trim().toLowerCase() === 'quit') {
                console.log(chalk.green('Goodbye!'));
                rl.close();
                process.exit(0);
            }
            else {
                console.log(chalk.yellow('Unknown command. Type "quit" to exit.'));
                prompt();
            }
        });
    }
    prompt();
    // Do not show CLI help or commands
    // await program.parseAsync(process.argv);
}))();
