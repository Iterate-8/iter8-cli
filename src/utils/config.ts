import fs from 'fs-extra';
import path from 'path';
import { SupabaseConfig } from '../services/supabase';
import { buildConfig } from '../config/buildConfig';

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

export interface Config {
  user?: string;
  supabase: SupabaseConfig;
  openai: {
    apiKey: string;
  };
  production: boolean;
}

function validateConfig(config: Config) {
  if (!config.supabase?.anonKey || config.supabase.anonKey.trim() === '') {
    throw new Error('Supabase anonymous key is missing from the binary. This binary was not built correctly.');
  }
  if (!config.openai?.apiKey || config.openai.apiKey.trim() === '') {
    throw new Error('OpenAI API key is missing from the binary. This binary was not built correctly.');
  }
}

export async function loadConfig(): Promise<Config> {
  const config: Config = {
    supabase: buildConfig.supabase as SupabaseConfig,
    openai: buildConfig.openai as { apiKey: string },
    production: buildConfig.production as boolean,
  };

  validateConfig(config);

  try {
    if (await fs.pathExists(CONFIG_PATH)) {
      const fileConfig = await fs.readJson(CONFIG_PATH);
      if (fileConfig.user) {
        config.user = fileConfig.user;
      }
    }
  } catch (err) {
    // ignore
  }
  return config;
}

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

export function getSupabaseConfig(): SupabaseConfig {
  return buildConfig.supabase as SupabaseConfig;
}
