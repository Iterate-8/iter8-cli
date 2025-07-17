import { Command } from 'commander';

const data = new Command('data')
  .description('Data operations')
  .argument('<action>', 'Action to perform (list, get <type>)')
  // .action(async (action) => { ... });

export default data;
