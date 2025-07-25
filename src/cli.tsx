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

  const handleApply = async () => {
    try {
      setMessage(chalk.cyan('Generating code changes with Ollama LLM...'));
      setDebugInfo(null);
      // Use all feedback items as input for the LLM
      const feedback = todos.length > 0 ? todos.join('\n') : input;
      if (!feedback) {
        setMessage(chalk.yellow('No feedback to send to LLM.'));
        return;
      }
      const result = await ollamaLLMService.generateCodeChanges(feedback);
      setDebugInfo('LLM result:\n' + JSON.stringify(result, null, 2));
      if (!result || typeof result !== 'object') {
        setMessage(chalk.red('LLM did not return a valid result object.'));
        return;
      }
      if (!result.changes || !Array.isArray(result.changes)) {
        setMessage(chalk.red('LLM result missing or invalid `changes` array.'));
        return;
      }
      if (result.changes.length === 0) {
        setMessage(chalk.yellow('No code changes generated by LLM.'));
        return;
      }
      await fileManagerService.applyChanges(result.changes);
      setMessage(chalk.green(`✅ Applied ${result.changes.length} code change(s):\n${result.changes.map(c => c.filePath).join('\n')}`));
    } catch (err: any) {
      setMessage(chalk.red('Failed to apply code changes from LLM.'));
      setDebugInfo('Error: ' + (err && err.stack ? err.stack : String(err)));
      logError(err);
    }
  };

  // Handle input submit
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
      } else if (command === 'apply') {
        setMode('apply');
        await handleApply();
        setTimeout(() => setMode('command'), 1500);
      } else if (command === 'revert') {
        setMessage(chalk.yellow('Revert feature coming soon (see CLI for full flow).'));
        setTimeout(() => setMode('command'), 1500);
      } else {
        setMessage(chalk.yellow('Unknown command. Type one of: refresh, change, apply, revert, quit'));
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
