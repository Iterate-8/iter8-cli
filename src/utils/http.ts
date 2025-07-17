import axios from 'axios';

/**
 * Fetches data from a URL using HTTP GET.
 * @param url The URL to fetch
 * @returns The response data
 */
export async function fetchData(url: string): Promise<any> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    throw new Error('HTTP request failed: ' + (err as Error).message);
  }
}
