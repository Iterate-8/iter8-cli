import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { SupabaseConfig } from '../services/supabase.js';

// Load environment variables
dotenv.config();

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

export interface Config {
  user?: string;
  supabase?: SupabaseConfig;
}

/**
 * Loads the configuration from environment variables and config.json
 * @returns {Promise<Config>} The config object
 */
export async function loadConfig(): Promise<Config> {
  const config: Config = {};

  // Load from environment variables first
  if (process.env.USER_NAME) {
    config.user = process.env.USER_NAME;
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    config.supabase = {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY
    };
  }

  // Fallback to config.json if environment variables are not set
  if (!config.supabase) {
    try {
      if (await fs.pathExists(CONFIG_PATH)) {
        const fileConfig = await fs.readJson(CONFIG_PATH);
        if (fileConfig.supabase) {
          config.supabase = fileConfig.supabase;
        }
        if (fileConfig.user && !config.user) {
          config.user = fileConfig.user;
        }
      }
    } catch (err) {
      // Ignore config file errors, use environment variables only
    }
  }

  return config;
}

/**
 * Saves the configuration to config.json (for non-environment variables)
 * @param {Config} config The config object
 */
export async function saveConfig(config: Config): Promise<void> {
  try {
    // Only save non-environment variable config
    const fileConfig: any = {};
    if (config.user && !process.env.USER_NAME) {
      fileConfig.user = config.user;
    }
    if (config.supabase && (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)) {
      fileConfig.supabase = config.supabase;
    }
    
    if (Object.keys(fileConfig).length > 0) {
      await fs.writeJson(CONFIG_PATH, fileConfig, { spaces: 2 });
    }
  } catch (err) {
    throw new Error('Failed to save config: ' + (err as Error).message);
  }
}

/**
 * Updates the Supabase configuration (only if not using environment variables)
 * @param {SupabaseConfig} supabaseConfig The Supabase configuration
 */
export async function updateSupabaseConfig(supabaseConfig: SupabaseConfig): Promise<void> {
  // Only update config file if not using environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    const config = await loadConfig();
    config.supabase = supabaseConfig;
    await saveConfig(config);
  }
}

/**
 * Gets Supabase configuration from environment variables or config file
 * @returns {SupabaseConfig | null} The Supabase configuration
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  // Check environment variables first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY
    };
  }
  
  return null;
}
