var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');
/**
 * Loads the configuration from environment variables and config.json
 * @returns {Promise<Config>} The config object
 */
export function loadConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = {};
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
                if (yield fs.pathExists(CONFIG_PATH)) {
                    const fileConfig = yield fs.readJson(CONFIG_PATH);
                    if (fileConfig.supabase) {
                        config.supabase = fileConfig.supabase;
                    }
                    if (fileConfig.user && !config.user) {
                        config.user = fileConfig.user;
                    }
                }
            }
            catch (err) {
                // Ignore config file errors, use environment variables only
            }
        }
        return config;
    });
}
/**
 * Saves the configuration to config.json (for non-environment variables)
 * @param {Config} config The config object
 */
export function saveConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Only save non-environment variable config
            const fileConfig = {};
            if (config.user && !process.env.USER_NAME) {
                fileConfig.user = config.user;
            }
            if (config.supabase && (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)) {
                fileConfig.supabase = config.supabase;
            }
            if (Object.keys(fileConfig).length > 0) {
                yield fs.writeJson(CONFIG_PATH, fileConfig, { spaces: 2 });
            }
        }
        catch (err) {
            throw new Error('Failed to save config: ' + err.message);
        }
    });
}
/**
 * Updates the Supabase configuration (only if not using environment variables)
 * @param {SupabaseConfig} supabaseConfig The Supabase configuration
 */
export function updateSupabaseConfig(supabaseConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only update config file if not using environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            const config = yield loadConfig();
            config.supabase = supabaseConfig;
            yield saveConfig(config);
        }
    });
}
/**
 * Gets Supabase configuration from environment variables or config file
 * @returns {SupabaseConfig | null} The Supabase configuration
 */
export function getSupabaseConfig() {
    // Check environment variables first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        return {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY
        };
    }
    return null;
}
