import fs from 'fs-extra';
import path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

/**
 * Loads the configuration from config.json, or returns default config if not found.
 * @returns {Promise<{ user?: string }>} The config object
 */
export async function loadConfig(): Promise<{ user?: string }> {
  try {
    if (await fs.pathExists(CONFIG_PATH)) {
      return await fs.readJson(CONFIG_PATH);
    }
    return {};
  } catch (err) {
    throw new Error('Failed to load config: ' + (err as Error).message);
  }
}

/**
 * Saves the configuration to config.json.
 * @param {object} config The config object
 */
export async function saveConfig(config: object): Promise<void> {
  try {
    await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
  } catch (err) {
    throw new Error('Failed to save config: ' + (err as Error).message);
  }
}
