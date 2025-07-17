var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
/**
 * Fetches data from a URL using HTTP GET.
 * @param url The URL to fetch
 * @returns The response data
 */
export function fetchData(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.get(url);
            return response.data;
        }
        catch (err) {
            throw new Error('HTTP request failed: ' + err.message);
        }
    });
}
