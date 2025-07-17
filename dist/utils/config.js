"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.getSupabaseConfig = getSupabaseConfig;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const buildConfig_1 = require("../config/buildConfig");
const CONFIG_PATH = path_1.default.resolve(process.cwd(), 'config.json');
/**
 * Validates that required configuration values are present
 * @throws {Error} if any required values are missing
 */
function validateConfig(config) {
    var _a, _b;
    if (!((_a = config.supabase) === null || _a === void 0 ? void 0 : _a.anonKey) || config.supabase.anonKey.trim() === '') {
        throw new Error('Supabase anonymous key is missing from the binary. This binary was not built correctly.');
    }
    if (!((_b = config.openai) === null || _b === void 0 ? void 0 : _b.apiKey) || config.openai.apiKey.trim() === '') {
        throw new Error('OpenAI API key is missing from the binary. This binary was not built correctly.');
    }
}
/**
 * Loads the configuration, using embedded build-time values
 * @returns {Promise<Config>} The config object
 */
function loadConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        // Cast buildConfig to match our Config type since we validate it
        const config = {
            supabase: buildConfig_1.buildConfig.supabase,
            openai: buildConfig_1.buildConfig.openai,
            production: buildConfig_1.buildConfig.production,
        };
        // Validate the embedded config values
        validateConfig(config);
        // Load user from config file if it exists
        try {
            if (yield fs_extra_1.default.pathExists(CONFIG_PATH)) {
                const fileConfig = yield fs_extra_1.default.readJson(CONFIG_PATH);
                if (fileConfig.user) {
                    config.user = fileConfig.user;
                }
            }
        }
        catch (err) {
            // Ignore config file errors
        }
        return config;
    });
}
/**
 * Saves the user configuration to config.json
 * @param {Config} config The config object
 */
function saveConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileConfig = {};
            if (config.user) {
                fileConfig.user = config.user;
            }
            if (Object.keys(fileConfig).length > 0) {
                yield fs_extra_1.default.writeJson(CONFIG_PATH, fileConfig, { spaces: 2 });
            }
        }
        catch (err) {
            throw new Error('Failed to save config: ' + err.message);
        }
    });
}
/**
 * Gets Supabase configuration from embedded build values
 * @returns {SupabaseConfig} The Supabase configuration
 */
function getSupabaseConfig() {
    return buildConfig_1.buildConfig.supabase;
}
