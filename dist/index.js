"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
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
exports.default = program;
