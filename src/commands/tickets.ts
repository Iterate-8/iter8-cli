import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, getSupabaseConfig } from '../utils/config';
import { logInfo, logError } from '../utils/logger';
import { supabaseService, Ticket } from '../services/supabase.js';

export function createTicketsCommand(): Command {
  const ticketsCommand = new Command('tickets')
    .description('Manage tickets from Supabase');

  // Configure Supabase
  ticketsCommand
    .command('configure')
    .description('Configure Supabase connection')
    .option('-u, --url <url>', 'Supabase URL')
    .option('-k, --key <key>', 'Supabase anonymous key')
    .action(async (options) => {
      const spinner = ora('Configuring Supabase...').start();
      try {
        // Check if environment variables are already set
        const envConfig = getSupabaseConfig();
        if (envConfig) {
          spinner.info('Supabase is already configured via environment variables');
          console.log(chalk.blue('SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file'));
          return;
        }

        if (!options.url || !options.key) {
          spinner.fail('Both URL and key are required');
          console.log(chalk.yellow('Usage: tickets configure --url <url> --key <key>'));
          console.log(chalk.blue('Or set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'));
          return;
        }

        // Test the connection
        await supabaseService.initialize({
          url: options.url,
          anonKey: options.key
        });

        spinner.succeed('Supabase configured successfully!');
        logInfo(chalk.green('You can now use the tickets commands.'));
      } catch (err) {
        spinner.fail('Failed to configure Supabase');
        logError(err);
      }
    });

  // List tickets
  ticketsCommand
    .command('list')
    .description('List all tickets')
    .option('-l, --limit <number>', 'Limit number of tickets', '10')
    .action(async (options) => {
      const spinner = ora('Fetching tickets...').start();
      try {
        const config = await loadConfig();
        if (!config.supabase) {
          spinner.fail('Supabase not configured');
          console.log(chalk.yellow('Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'));
          console.log(chalk.yellow('Or run "tickets configure" to set up Supabase.'));
          return;
        }

        await supabaseService.initialize(config.supabase);
        const tickets = await supabaseService.getTickets();
        
        const limit = parseInt(options.limit);
        const limitedTickets = tickets.slice(0, limit);

        spinner.succeed(`Found ${tickets.length} tickets (showing ${limitedTickets.length})`);
        
        if (limitedTickets.length === 0) {
          console.log(chalk.yellow('No tickets found.'));
          return;
        }

        console.log();
        limitedTickets.forEach((ticket, index) => {
          displayTicket(ticket, index + 1);
        });
      } catch (err) {
        spinner.fail('Failed to fetch tickets');
        logError(err);
      }
    });

  // Show single ticket
  ticketsCommand
    .command('show <id>')
    .description('Show details of a specific ticket')
    .action(async (id) => {
      const spinner = ora(`Fetching ticket ${id}...`).start();
      try {
        const config = await loadConfig();
        if (!config.supabase) {
          spinner.fail('Supabase not configured');
          console.log(chalk.yellow('Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'));
          console.log(chalk.yellow('Or run "tickets configure" to set up Supabase.'));
          return;
        }

        await supabaseService.initialize(config.supabase);
        const ticket = await supabaseService.getTicket(parseInt(id));

        if (!ticket) {
          spinner.fail(`Ticket ${id} not found`);
          return;
        }

        spinner.succeed(`Found ticket ${id}`);
        console.log();
        displayTicketDetails(ticket);
      } catch (err) {
        spinner.fail('Failed to fetch ticket');
        logError(err);
      }
    });

  // Update ticket status
  ticketsCommand
    .command('update-status <id> <status>')
    .description('Update ticket status')
    .action(async (id, status) => {
      const spinner = ora(`Updating ticket ${id} status...`).start();
      try {
        const config = await loadConfig();
        if (!config.supabase) {
          spinner.fail('Supabase not configured');
          console.log(chalk.yellow('Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'));
          console.log(chalk.yellow('Or run "tickets configure" to set up Supabase.'));
          return;
        }

        await supabaseService.initialize(config.supabase);
        await supabaseService.updateTicketStatus(parseInt(id), status);

        spinner.succeed(`Updated ticket ${id} status to "${status}"`);
      } catch (err) {
        spinner.fail('Failed to update ticket status');
        logError(err);
      }
    });

  // Discover database schema
  ticketsCommand
    .command('discover')
    .description('Discover database tables and structure')
    .action(async () => {
      const spinner = ora('Discovering database schema...').start();
      try {
        const config = await loadConfig();
        if (!config.supabase) {
          spinner.fail('Supabase not configured');
          console.log(chalk.yellow('Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'));
          console.log(chalk.yellow('Or run "tickets configure" to set up Supabase.'));
          return;
        }

        await supabaseService.initialize(config.supabase);
        const tables = await supabaseService.discoverTables();

        spinner.succeed(`Found ${tables.length} tables`);
        console.log();
        console.log(chalk.bold.cyan('Available Tables:'));
        tables.forEach((table, index) => {
          console.log(chalk.blue(`${index + 1}. ${table}`));
        });

        // Show structure of first few tables
        console.log();
        console.log(chalk.bold.cyan('Table Structures:'));
        for (const table of tables.slice(0, 3)) {
          try {
            const structure = await supabaseService.getTableStructure(table);
            console.log();
            console.log(chalk.yellow(`Table: ${table}`));
            structure.forEach((column: any) => {
              const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
              console.log(`  ${column.column_name} (${column.data_type}) ${nullable}`);
            });
          } catch (err) {
            console.log(chalk.red(`Failed to get structure for ${table}`));
          }
        }
      } catch (err) {
        spinner.fail('Failed to discover schema');
        logError(err);
      }
    });

  return ticketsCommand;
}

function displayTicket(ticket: Ticket, index: number): void {
  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  
  // Try different possible title fields
  const title = ticket.title || ticket.name || ticket.subject || ticket.summary || `Ticket ${ticket.id}`;
  console.log(chalk.bold.cyan(`#${ticket.id}`) + ' ' + chalk.bold.white(title));
  
  if (ticket.status) {
    console.log(chalk.gray('  Status: ') + statusColor(ticket.status));
  }
  if (ticket.priority) {
    console.log(chalk.gray('  Priority: ') + priorityColor(ticket.priority));
  }
  
  // Try different possible description fields
  const description = ticket.description || ticket.content || ticket.body || ticket.message;
  if (description) {
    const truncatedDesc = description.length > 100 
      ? description.substring(0, 100) + '...'
      : description;
    console.log(chalk.gray('  Description: ') + chalk.white(truncatedDesc));
  }
  
  // Try different possible date fields
  const dateField = ticket.created_at || ticket.created || ticket.date || ticket.timestamp;
  if (dateField) {
    console.log(chalk.gray('  Created: ') + chalk.white(new Date(dateField).toLocaleDateString()));
  }
  console.log();
}

function displayTicketDetails(ticket: Ticket): void {
  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  
  // Try different possible title fields
  const title = ticket.title || ticket.name || ticket.subject || ticket.summary || `Ticket ${ticket.id}`;
  console.log(chalk.bold.cyan(`Ticket #${ticket.id}`));
  console.log(chalk.bold.white(title));
  console.log();
  
  if (ticket.status) {
    console.log(chalk.gray('Status: ') + statusColor(ticket.status));
  }
  if (ticket.priority) {
    console.log(chalk.gray('Priority: ') + priorityColor(ticket.priority));
  }
  
  // Try different possible date fields
  const createdDate = ticket.created_at || ticket.created || ticket.date || ticket.timestamp;
  if (createdDate) {
    console.log(chalk.gray('Created: ') + chalk.white(new Date(createdDate).toLocaleString()));
  }
  
  const updatedDate = ticket.updated_at || ticket.updated || ticket.modified;
  if (updatedDate) {
    console.log(chalk.gray('Updated: ') + chalk.white(new Date(updatedDate).toLocaleString()));
  }
  console.log();
  
  // Try different possible description fields
  const description = ticket.description || ticket.content || ticket.body || ticket.message;
  if (description) {
    console.log(chalk.bold.gray('Description:'));
    console.log(chalk.white(description));
    console.log();
  }
}

function getStatusColor(status: string | undefined) {
  if (!status) return chalk.white;
  switch (status.toLowerCase()) {
    case 'open':
      return chalk.green;
    case 'in_progress':
      return chalk.yellow;
    case 'closed':
      return chalk.red;
    case 'resolved':
      return chalk.blue;
    default:
      return chalk.white;
  }
}

function getPriorityColor(priority?: string) {
  if (!priority) return chalk.white;
  
  switch (priority.toLowerCase()) {
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.green;
    default:
      return chalk.white;
  }
}