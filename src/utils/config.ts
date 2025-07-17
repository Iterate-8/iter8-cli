import fs from 'fs-extra';
import path from 'path';
import { SupabaseConfig } from '../services/supabase';
import { buildConfig } from '../config/buildConfig';

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

export interface Config {
  user?: string;
  supabase: SupabaseConfig; // Remove optional since it's always provided
  openai: {
    apiKey: string;
  };
  production: boolean;
}

/**
 * Validates that required configuration values are present
 * @throws {Error} if any required values are missing
 */
function validateConfig(config: Config) {
  if (!config.supabase?.anonKey || config.supabase.anonKey.trim() === '') {
    throw new Error('Supabase anonymous key is missing from the binary. This binary was not built correctly.');
  }
  if (!config.openai?.apiKey || config.openai.apiKey.trim() === '') {
    throw new Error('OpenAI API key is missing from the binary. This binary was not built correctly.');
  }
}

/**
 * Loads the configuration, using embedded build-time values
 * @returns {Promise<Config>} The config object
 */
export async function loadConfig(): Promise<Config> {
  // Cast buildConfig to match our Config type since we validate it
  const config: Config = {
    supabase: buildConfig.supabase as SupabaseConfig,
    openai: buildConfig.openai as { apiKey: string },
    production: buildConfig.production as boolean,
  };

  // Validate the embedded config values
  validateConfig(config);

  // Load user from config file if it exists
  try {
    if (await fs.pathExists(CONFIG_PATH)) {
      const fileConfig = await fs.readJson(CONFIG_PATH);
      if (fileConfig.user) {
        config.user = fileConfig.user;
      }
    }
  } catch (err) {
    // Ignore config file errors
  }

  return config;
}

/**
 * Saves the user configuration to config.json
 * @param {Config} config The config object
 */
export async function saveConfig(config: Config): Promise<void> {
  try {
    const fileConfig: any = {};
    if (config.user) {
      fileConfig.user = config.user;
    }
    
    if (Object.keys(fileConfig).length > 0) {
      await fs.writeJson(CONFIG_PATH, fileConfig, { spaces: 2 });
    }
  } catch (err) {
    throw new Error('Failed to save config: ' + (err as Error).message);
  }
}

/**
 * Gets Supabase configuration from embedded build values
 * @returns {SupabaseConfig} The Supabase configuration
 */
export function getSupabaseConfig(): SupabaseConfig {
  return buildConfig.supabase as SupabaseConfig;
}
