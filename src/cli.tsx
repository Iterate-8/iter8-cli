import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import figlet from 'figlet';

const todos = [
  'Set up authentication flow',
  'Implement user profile page',
  'Integrate payment gateway',
  'Write unit and integration tests',
  'Configure CI/CD pipeline',
  'Optimize app performance',
  'Add error tracking and logging',
  'Prepare production deployment scripts'
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [quit, setQuit] = useState(false);
  const [error, setError] = useState('');

  useInput((inputChar, key) => {
    if (quit) return;
    if (key.return) {
      if (input.trim().toLowerCase() === 'quit') {
        setQuit(true);
      } else {
        setError('Unknown command. Type "quit" to exit.');
        setInput('');
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.length > 0 ? prev.slice(0, -1) : '');
    } else if (key.ctrl && inputChar === 'c') {
      setQuit(true);
    } else if (inputChar && !key.ctrl && !key.meta) {
      setInput(prev => prev + inputChar);
    }
  });

  useEffect(() => {
    if (quit) {
      // End Ink process when quit is set
      // This will exit the CLI cleanly
      // @ts-ignore
      if (typeof process !== 'undefined' && process.exit) {
        setTimeout(() => process.exit(0), 100);
      }
    }
  }, [quit]);

  if (quit) {
    return (
      <Box flexDirection="column">
        <Text color="green">Goodbye!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="magentaBright">{chalk.magentaBright(figletBanner('Iter8'))}</Text>
      <Text bold color="blueBright">TODOS</Text>
      {todos.map((todo, idx) => (
        <Box key={idx}><Text color="blueBright">• </Text><Text color="whiteBright" bold={false}>{todo}</Text></Box>
      ))}
      <Box marginTop={1} borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="whiteBright">{'> '}{input}</Text>
      </Box>
      {error && <Text color="yellow">{error}</Text>}
    </Box>
  );
};

function figletBanner(text: string) {
  return figlet.textSync(text, { horizontalLayout: 'default', verticalLayout: 'default' });
}

render(<App />);
