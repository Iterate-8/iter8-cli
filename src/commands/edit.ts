import { Command } from 'commander';
import { ollamaLLMService } from '../services/ollamaLLM.js';
import { fileManagerService } from '../services/fileManager.js';

const edit = new Command('edit')
  .description('Edit files based on instruction')
  .argument('<instruction>', 'Instruction for editing')
  .option('--files <files...>', 'Files to edit')
  .action(async (instruction, options) => {
    try {
      // Generate code changes from LLM
      const { changes, summary } = await ollamaLLMService.generateCodeChanges(instruction);
      // Display the changes to the user
      await fileManagerService.displayChanges(changes);
      console.log('\nSummary:', summary);
      // Optionally, prompt for confirmation here (skipped for now)
      // Apply the changes
      await fileManagerService.applyChanges(changes);
      console.log('All changes applied successfully!');
    } catch (err) {
      console.error('Failed to apply code changes:', err);
    }
  });

export default edit;
