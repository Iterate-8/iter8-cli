"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logError = logError;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Logs an info message to the console.
 * @param message The message to log
 */
function logInfo(message) {
    console.log(chalk_1.default.cyan('[INFO]'), message);
}
/**
 * Logs an error message to the console.
 * @param error The error or message to log
 */
function logError(error) {
    if (error instanceof Error) {
        console.error(chalk_1.default.red('[ERROR]'), error.message);
    }
    else {
        console.error(chalk_1.default.red('[ERROR]'), error);
    }
}
