import { Command } from 'commander';
const edit = new Command('edit')
    .description('Edit files based on instruction')
    .argument('<instruction>', 'Instruction for editing')
    .option('--files <files...>', 'Files to edit');
// .action(async (instruction, options) => { ... });
export default edit;
