/**
 * Loads the configuration from config.json, or returns default config if not found.
 * @returns {Promise<{ user?: string; startupName?: string }>} The config object
 */
export declare function loadConfig(): Promise<{
    user?: string;
    startupName?: string;
}>;
/**
 * Saves the configuration to config.json.
 * @param {object} config The config object
 */
export declare function saveConfig(config: object): Promise<void>;
