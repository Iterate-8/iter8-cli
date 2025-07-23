// This CLI is now fully agentic and interactive.
import 'dotenv/config';
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { loadConfig } from './utils/config.js';
import { supabaseService } from './services/supabase.js';
import { openAIService } from './services/openai.js';
import { fileManagerService } from './services/fileManager.js';
import { ollamaLLMService } from './services/ollamaLLM.js';
import { logError } from './utils/logger.js';
import figlet from 'figlet';
import { runRagAgent, indexCodebase } from './services/ragAgent.js';
import { runMultiStepAgent } from './services/agent.js';

const COMMANDS = [
  'refresh',
  'change',
  'apply',
  'revert',
  'quit'
];

const FigletBanner = () => (
  <Box marginBottom={1}>
    <Text color="white">{figlet.textSync('Iter8', { horizontalLayout: 'default', verticalLayout: 'default' })}</Text>
  </Box>
);

const TodosList = ({ todos }: { todos: string[] }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Text color="blueBright" bold>
      TODOS
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
      </Box>
    ))}
  </Box>
);

const ClaudeInputBox = ({ value, onChange, onSubmit, placeholder }: any) => {
  const termWidth = process.stdout.columns || 80;
  const width = termWidth - 4; // account for corners and padding
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

  // Initial load
  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      let name = process.env.STARTUP_NAME || cfg.user;
      setConfig(cfg);
      if (!name) {
        setMode('startup');
      } else {
        setStartupName(name);
        setMode('command');
        await initializeServices(cfg, name);
      }
      // Index the codebase for RAG (show message)
      setMessage(chalk.cyan('Indexing codebase for code agent...'));
      await indexCodebase('./');
      setMessage(chalk.green('Codebase indexed. Ready for code agent queries!'));
    })();
  }, []);

  const initializeServices = useCallback(async (cfg: any, name: string) => {
    try {
      if (!cfg.supabase) throw new Error('Supabase not configured');
      await supabaseService.initialize(cfg.supabase);
      await openAIService.initialize();
      await fileManagerService.initialize();
      if (name) {
        const feedbackItems = await supabaseService.getFeedbackByStartupName(name);
        setTodos(feedbackItems);
      }
    } catch (err) {
      setMessage(chalk.red('Failed to initialize services'));
      logError(err);
    }
  }, []);

  // Update handleSubmit to use RAG agent for user queries
  const handleSubmit = async (val: string) => {
    const inputVal = val.trim();
    setInput('');
    setMessage('');
    if (mode === 'startup') {
      setStartupName(inputVal);
      if (config) {
        config.user = inputVal;
        await import('./utils/config.js').then(m => m.saveConfig(config));
      }
      setMode('command');
      await initializeServices(config, inputVal);
      return;
    }
    if (mode === 'command') {
      // If user enters a known command, handle as before
      const command = inputVal.toLowerCase();
      if (command === 'quit') {
        setMessage(chalk.green('Goodbye!'));
        setTimeout(() => exit(), 500);
      } else if (command === 'refresh') {
        setMessage(chalk.blue('🔄 Fetching latest feedback...'));
        if (startupName) {
          const feedbackItems = await supabaseService.getFeedbackByStartupName(startupName);
          setTodos(feedbackItems);
        }
        setMessage(chalk.green('✅ Feedback refreshed!'));
      } else if (command === 'change') {
        setMode('startup');
      } else if (command === 'revert') {
        setMessage(chalk.yellow('Revert feature coming soon (see CLI for full flow).'));
        setTimeout(() => setMode('command'), 1500);
      } else {
        // Otherwise, treat as a code agent query
        setMessage(chalk.cyan('Running multi-step code agent...'));
        try {
          const result = await runMultiStepAgent(inputVal);
          // Try to parse and apply code changes if present
          let parsed;
          try {
            parsed = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
          } catch (e) {
            setMessage(chalk.red('Agent did not return valid JSON code changes.'));
            setDebugInfo('Raw output: ' + result.output);
            return;
          }
          if (!parsed || !parsed.changes || parsed.changes.length === 0) {
            setMessage(chalk.yellow('No code changes generated by agent.'));
            return;
          }
          await fileManagerService.applyChanges(parsed.changes);
          setMessage(chalk.green(`✅ Applied ${parsed.changes.length} code change(s):\n${parsed.changes.map((c: any) => c.filePath).join('\n')}`));
        } catch (err: any) {
          setMessage(chalk.red('Failed to apply code changes from agent.'));
          setDebugInfo('Error: ' + (err && err.stack ? err.stack : String(err)));
          logError(err);
        }
      }
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <FigletBanner />
      {startupName && <Text color="cyan">Startup: <Text color="whiteBright">{startupName}</Text></Text>}
      <TodosList todos={todos} />
      <CommandsList />
      {message && <Text>{message}</Text>}
      {debugInfo && (
        <Text color="gray">{debugInfo}</Text>
      )}
      <ClaudeInputBox
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={mode === 'startup' ? 'Enter your startup name...' : 'Type a command...'}
      />
    </Box>
  );
};

render(<App />);
