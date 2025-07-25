// This file contains configuration that will be embedded at build time
const requiredEnvVars = {
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Check for missing or empty environment variables during build
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value || value.trim() === '') {
    console.warn(`Warning: Missing environment variable: ${key}. Some features may not work.`);
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
  // HuggingFace configuration for Mac-optimized models
  huggingface: {
    // Recommended models for Mac (in order of preference):
    // 1. 'Xenova/LaMini-Flan-T5-248M' - Small, fast, good for code
    // 2. 'Xenova/CodeT5-small' - Specialized for code generation
    // 3. 'microsoft/DialoGPT-small' - Good conversational model
    // 4. 'Xenova/distilbert-base-uncased' - Very lightweight fallback
    model: process.env.HUGGINGFACE_MODEL || 'Xenova/LaMini-Flan-T5-248M',
    
    // Mac-optimized settings
    maxLength: 1024,      // Reasonable length for Mac performance
    temperature: 0.1,     // Low temperature for consistent code
    batchSize: 1,         // Process one at a time on Mac
    numThreads: 1,        // Single thread for stability
    memoryLimit: 2048,    // 2GB memory limit (adjust based on your Mac)
  },
  // Legacy Ollama config (kept for backward compatibility)
  ollama: {
    apiUrl: 'http://127.0.0.1:11434/api/generate',
    model: 'qwen2.5-coder:7b',
  },
  // Default to HuggingFace for Mac compatibility
  defaultLLM: 'huggingface', // Options: 'huggingface', 'ollama', 'openai'
  production: true,
};