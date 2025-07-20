// This file contains configuration that will be embedded at build time
const requiredEnvVars = {
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Check for missing or empty environment variables during build
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value || value.trim() === '') {
    throw new Error(`Missing or empty required environment variable: ${key}`);
  }
});

// These values will be embedded in the binary at build time
export const buildConfig = {
  supabase: {
    url: 'https://eousczgdnqjsnjnkcswq.supabase.co',
    anonKey: requiredEnvVars.SUPABASE_ANON_KEY as string,
  },
  openai: {
    apiKey: requiredEnvVars.OPENAI_API_KEY as string,
  },
  ollama: {
    apiUrl: 'http://127.0.0.1:11434/api/generate',
    model: 'llama3.2:latest', // Default model, can be overridden
  },
  production: true,
};
