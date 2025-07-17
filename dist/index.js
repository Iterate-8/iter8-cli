import { Command } from 'commander';
const program = new Command();
program
    .name('iter8')
    .description('Iter8 CLI application')
    .version('1.0.0');
// Register commands (edit, ask, data)
// ...existing code...
// Global error handling
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});
export default program;
