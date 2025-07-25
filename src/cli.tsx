// This CLI is now fully agentic and interactive.
import 'dotenv/config';

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { loadConfig } from './utils/config.js';
import { supabaseService } from './services/supabase.js';
import { openAIService } from './services/openai.js';
import { fileManagerService } from './services/fileManager.js';
import { ollamaLLMService } from './services/ollamaLLM.js';
import { logError, logInfo } from './utils/logger.js';
import figlet from 'figlet';
import { runMultiStepAgent } from './services/ragAgent.js';
import { loadIndexCache, saveIndexCache, indexCodebase } from './services/codebaseIndexer.js';
import { addChunk, clearVectorStore } from './services/vectorStore.js';

// Load codebase index from cache or re-index
async function setupCodebaseIndex(rootDir = './', progressCallback?: (msg: string) => void) {
  clearVectorStore();
  let chunks = await loadIndexCache(rootDir);
  if (!chunks) {
    chunks = await indexCodebase(rootDir, progressCallback);
    await saveIndexCache(rootDir, chunks);
  }
  for (const chunk of chunks) {
    addChunk(chunk);
  }
}

const COMMANDS = [
  'help',
  'refresh',
  'change',
  'apply',
  'revert',
  'index',
  'status',
  'clear',
  'quit'
];

const HELP_TEXT = {
  help: 'Show this help message',
  refresh: 'Refresh feedback from Supabase',
  change: 'Change startup name',
  apply: 'Apply pending changes',
  revert: 'Revert recent changes',
  index: 'Re-index the codebase',
  status: 'Show current status',
  clear: 'Clear the screen',
  quit: 'Exit the application'
};

const FigletBanner = () => (
  <Box marginBottom={1}>
    <Text color="white">{figlet.textSync('Iter8', { horizontalLayout: 'default', verticalLayout: 'default' })}</Text>
  </Box>
);

const TodosList = ({ todos }: { todos: string[] }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Text color="blueBright" bold>
      FEEDBACK ITEMS
    </Text>
    {todos.length > 0 ? (
      todos.map((todo, idx) => (
        <Box key={idx}>
          <Text color="blueBright">{`${idx + 1}. `}</Text>
          <Text color="whiteBright">{todo}</Text>
        </Box>
      ))
    ) : (
      <Text color="gray">No feedback found for this startup.</Text>
    )}
  </Box>
);

const CommandsList = () => (
  <Box flexDirection="column" marginBottom={1}>
    <Text color="cyan" bold>Commands:</Text>
    {COMMANDS.map(cmd => (
      <Box key={cmd}>
        <Text color="white">  {cmd}</Text>
        <Text color="gray"> - {HELP_TEXT[cmd as keyof typeof HELP_TEXT]}</Text>
      </Box>
    ))}
    <Text color="yellow">
      Or type any coding request to use the AI agent...
    </Text>
  </Box>
);

const StatusDisplay = ({ isIndexed, backupCount }: { isIndexed: boolean; backupCount: number }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Text color="magenta" bold>STATUS</Text>
    <Text color={isIndexed ? "green" : "red"}>
      Codebase: {isIndexed ? "✓ Indexed" : "✗ Not indexed"}
    </Text>
    <Text color="blue">
      Backups: {backupCount} files
    </Text>
  </Box>
);

const ClaudeInputBox = ({ value, onChange, onSubmit, placeholder }: any) => {
  const termWidth = process.stdout.columns || 80;
  const width = Math.max(termWidth - 4, 40); // account for corners and padding, minimum width
  return (
    <Box flexDirection="column">
      {/* Top cyan line with left and right corners */}
      <Text color="cyan">{'┌' + '─'.repeat(width) + '┐'}</Text>
      {/* Input row: left cyan vertical, input, right cyan vertical */}
      <Box>
        <Text color="cyan">│</Text>
        <Box width={width}>
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
            focus
            showCursor
          />
        </Box>
        <Text color="cyan">│</Text>
      </Box>
      {/* Bottom cyan line with left and right corners */}
      <Text color="cyan">{'└' + '─'.repeat(width) + '┘'}</Text>
    </Box>
  );
};

const App: React.FC = () => {
  const { exit } = useApp();
  const [config, setConfig] = useState<any>(null);
  const [startupName, setStartupName] = useState<string>('');
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'command'|'startup'|'apply'|'select'|'none'>('none');
  const [message, setMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isIndexed, setIsIndexed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Clear message after some time
  useEffect(() => {
    if (message && !isLoading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, isLoading]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setMessage(chalk.cyan('Initializing...'));
        
        const cfg = await loadConfig();
        let name = process.env.STARTUP_NAME || cfg.user;
        setConfig(cfg);
        
        if (!name) {
          setMode('startup');
          setMessage(chalk.yellow('Please enter your startup name to begin.'));
        } else {
          setStartupName(name);
          setMode('command');
          await initializeServices(cfg, name);
          
          // Index the codebase for RAG
          setMessage(chalk.cyan('Indexing codebase for AI agent...'));
          await setupCodebaseIndex('./');
          setIsIndexed(true);
          setMessage(chalk.green('✓ Ready! Codebase indexed and services initialized.'));
        }
        
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setMessage(chalk.red(`Initialization failed: ${error}`));
        logError(error);
      }
    })();
  }, []);

  const initializeServices = useCallback(async (cfg: any, name: string) => {
    try {
      if (cfg.supabase) {
        await supabaseService.initialize(cfg.supabase);
        logInfo('Supabase initialized');
      }
      
      await openAIService.initialize();
      await fileManagerService.initialize();
      logInfo('Services initialized');
      
      if (name) {
        const feedbackItems = await supabaseService.getFeedbackByStartupName(name);
        setTodos(feedbackItems);
        logInfo(`Loaded ${feedbackItems.length} feedback items`);
      }
    } catch (err) {
      logError(`Failed to initialize services: ${err}`);
      // Don't throw - allow the app to continue with limited functionality
      setMessage(chalk.yellow('⚠ Some services failed to initialize. Limited functionality available.'));
    }
  }, []);

  const showHelp = () => {
    let helpMessage = chalk.cyan.bold('AVAILABLE COMMANDS:\n');
    Object.entries(HELP_TEXT).forEach(([cmd, desc]) => {
      helpMessage += chalk.white(`  ${cmd.padEnd(8)} `) + chalk.gray(`- ${desc}\n`);
    });
    helpMessage += chalk.yellow('\nOr type any coding request to use the AI agent...');
    setMessage(helpMessage);
  };

  const handleSubmit = async (val: string) => {
    const inputVal = val.trim();
    setInput('');
    setDebugInfo(null);
    
    if (!inputVal) return;

    if (mode === 'startup') {
      setStartupName(inputVal);
      if (config) {
        config.user = inputVal;
        await import('./utils/config.js').then(m => m.saveConfig(config));
      }
      setMode('command');
      setIsLoading(true);
      await initializeServices(config, inputVal);
      
      // Index codebase
      setMessage(chalk.cyan('Indexing codebase...'));
      try {
        await setupCodebaseIndex('./', msg => setMessage(chalk.cyan(msg)));
        setIsIndexed(true);
        setMessage(chalk.green('✓ Setup complete! Ready to help with your code.'));
      } catch (error) {
        setMessage(chalk.red(`Failed to index codebase: ${error}`));
        logError(error);
      }
      setIsLoading(false);
      return;
    }

    if (mode === 'command') {
      const command = inputVal.toLowerCase();
      
      // Handle built-in commands
      if (command === 'quit' || command === 'exit') {
        setMessage(chalk.green('Goodbye! 👋'));
        setTimeout(() => exit(), 500);
        return;
      }
      
      if (command === 'help') {
        showHelp();
        return;
      }
      
      if (command === 'clear') {
        setMessage('');
        setDebugInfo(null);
        return;
      }
      
      if (command === 'status') {
        const backupCount = fileManagerService.getBackupCount();
        setMessage(chalk.blue(`Status: Indexed=${isIndexed}, Backups=${backupCount}, Feedback=${todos.length}`));
        return;
      }
      
      if (command === 'refresh') {
        setIsLoading(true);
        setMessage(chalk.blue('🔄 Fetching latest feedback...'));
        try {
          if (startupName) {
            const feedbackItems = await supabaseService.getFeedbackByStartupName(startupName);
            setTodos(feedbackItems);
            setMessage(chalk.green(`✅ Refreshed! Found ${feedbackItems.length} feedback items.`));
          } else {
            setMessage(chalk.yellow('No startup name set.'));
          }
        } catch (error) {
          setMessage(chalk.red(`Failed to refresh: ${error}`));
          logError(error);
        }
        setIsLoading(false);
        return;
      }
      
      if (command === 'change') {
        setMode('startup');
        setMessage(chalk.yellow('Enter new startup name:'));
        return;
      }
      
      if (command === 'index') {
        setIsLoading(true);
        setMessage(chalk.cyan('Re-indexing codebase...'));
        try {
          clearVectorStore();
          await setupCodebaseIndex('./', msg => setMessage(chalk.cyan(msg)));
          setIsIndexed(true);
          setMessage(chalk.green('✅ Codebase re-indexed successfully!'));
        } catch (error) {
          setMessage(chalk.red(`Failed to index: ${error}`));
          logError(error);
        }
        setIsLoading(false);
        return;
      }
      
      if (command === 'revert') {
        setIsLoading(true);
        setMessage(chalk.cyan('Reverting changes...'));
        try {
          await fileManagerService.revertChanges();
          setMessage(chalk.green('✅ Changes reverted successfully!'));
        } catch (error) {
          setMessage(chalk.red(`Failed to revert: ${error}`));
          logError(error);
        }
        setIsLoading(false);
        return;
      }

      // If not a command, treat as AI agent query
      if (!isIndexed) {
        setMessage(chalk.red('❌ Codebase not indexed. Run "index" command first.'));
        return;
      }

      setIsLoading(true);
      setMessage(chalk.cyan('🤖 AI agent working...'));
      
      try {
        // Use RAG agent for better context
        const result = await runMultiStepAgent(inputVal);
        
        if (!result || !result.changes || result.changes.length === 0) {
          setMessage(chalk.yellow('🤔 No code changes suggested. Try being more specific.'));
          setIsLoading(false);
          return;
        }

        // Display the changes for review
        await fileManagerService.displayChanges(result.changes);
        
        // Apply changes
        await fileManagerService.applyChanges(result.changes);
        
        const summary = result.summary || `Applied ${result.changes.length} changes`;
        setMessage(chalk.green(`✅ ${summary}`));
        
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        setMessage(chalk.red(`❌ AI agent failed: ${errorMsg}`));
        
        // Show debug info for development
        if (process.env.NODE_ENV === 'development') {
          setDebugInfo(err?.stack || errorMsg);
        }
        
        logError(err);
      }
      
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (mode === 'startup') {
      return 'Enter your startup name...';
    }
    if (isLoading) {
      return 'Processing...';
    }
    return 'Type a command or describe what you want to code...';
  };

  return (
    <Box flexDirection="column" padding={1}>
      <FigletBanner />
      
      {startupName && (
        <Box marginBottom={1}>
          <Text color="cyan">Startup: </Text>
          <Text color="whiteBright">{startupName}</Text>
        </Box>
      )}
      
      {mode === 'command' && (
        <StatusDisplay 
          isIndexed={isIndexed} 
          backupCount={fileManagerService.getBackupCount()} 
        />
      )}
      
      <TodosList todos={todos} />
      
      {mode === 'command' && !isLoading && <CommandsList />}
      
      {message && (
        <Box marginBottom={1}>
          <Text>{message}</Text>
        </Box>
      )}
      
      {debugInfo && (
        <Box marginBottom={1}>
          <Text color="gray">{debugInfo}</Text>
        </Box>
      )}
      
      <ClaudeInputBox
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={getPlaceholder()}
      />
    </Box>
  );
};

render(<App />);