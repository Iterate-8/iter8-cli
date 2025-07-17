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
const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');
/**
 * Loads the configuration from config.json, or returns default config if not found.
 * @returns {Promise<{ user?: string }>} The config object
 */
export function loadConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (yield fs.pathExists(CONFIG_PATH)) {
                return yield fs.readJson(CONFIG_PATH);
            }
            return {};
        }
        catch (err) {
            throw new Error('Failed to load config: ' + err.message);
        }
    });
}
/**
 * Saves the configuration to config.json.
 * @param {object} config The config object
 */
export function saveConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
        }
        catch (err) {
            throw new Error('Failed to save config: ' + err.message);
        }
    });
}
