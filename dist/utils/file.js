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
/**
 * Reads a file safely, returning its contents or undefined if not found.
 * @param path Path to the file
 */
export function readFileSafe(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (yield fs.pathExists(path)) {
                return yield fs.readFile(path, 'utf8');
            }
            return undefined;
        }
        catch (err) {
            throw new Error('Failed to read file: ' + err.message);
        }
    });
}
/**
 * Writes data to a file safely.
 * @param path Path to the file
 * @param data Data to write
 */
export function writeFileSafe(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.outputFile(path, data);
        }
        catch (err) {
            throw new Error('Failed to write file: ' + err.message);
        }
    });
}
