import { SupabaseConfig } from '../services/supabase';
export interface Config {
    user?: string;
    supabase: SupabaseConfig;
    openai: {
        apiKey: string;
    };
    production: boolean;
}
/**
 * Loads the configuration, using embedded build-time values
 * @returns {Promise<Config>} The config object
 */
export declare function loadConfig(): Promise<Config>;
/**
 * Saves the user configuration to config.json
 * @param {Config} config The config object
 */
export declare function saveConfig(config: Config): Promise<void>;
/**
 * Gets Supabase configuration from embedded build values
 * @returns {SupabaseConfig} The Supabase configuration
 */
export declare function getSupabaseConfig(): SupabaseConfig;
