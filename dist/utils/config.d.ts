import { SupabaseConfig } from '../services/supabase.js';
export interface Config {
    user?: string;
    supabase?: SupabaseConfig;
}
/**
 * Loads the configuration from environment variables and config.json
 * @returns {Promise<Config>} The config object
 */
export declare function loadConfig(): Promise<Config>;
/**
 * Saves the configuration to config.json (for non-environment variables)
 * @param {Config} config The config object
 */
export declare function saveConfig(config: Config): Promise<void>;
/**
 * Updates the Supabase configuration (only if not using environment variables)
 * @param {SupabaseConfig} supabaseConfig The Supabase configuration
 */
export declare function updateSupabaseConfig(supabaseConfig: SupabaseConfig): Promise<void>;
/**
 * Gets Supabase configuration from environment variables or config file
 * @returns {SupabaseConfig | null} The Supabase configuration
 */
export declare function getSupabaseConfig(): SupabaseConfig | null;
