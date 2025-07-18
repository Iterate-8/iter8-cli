import axios from 'axios';

export async function fetchData(url: string): Promise<any> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    throw new Error('HTTP request failed: ' + (err as Error).message);
  }
}
