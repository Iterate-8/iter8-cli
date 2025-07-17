import { Command } from 'commander';

const ask = new Command('ask')
  .description('Ask a question to the API')
  .argument('<question>', 'Question to ask')
  // .action(async (question) => { ... });

export default ask;
