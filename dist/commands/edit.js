"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const edit = new commander_1.Command('edit')
    .description('Edit files based on instruction')
    .argument('<instruction>', 'Instruction for editing')
    .option('--files <files...>', 'Files to edit');
// .action(async (instruction, options) => { ... });
exports.default = edit;
