import fetch from 'node-fetch';

const OLLAMA_EMBEDDING_URL = 'http://127.0.0.1:11434/api/embed';
const OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';

export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }
  const res = await fetch(OLLAMA_EMBEDDING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text
    })
  });
  if (!res.ok) throw new Error(`Ollama embedding API error: ${res.statusText}`);
  const data: any = await res.json();
  console.log('Ollama embedding API response:', data);
  // Ollama returns { embeddings: [[...]], model: ... }
  if (Array.isArray(data.embeddings) && data.embeddings.length > 0) {
    return data.embeddings[0];
  }
  throw new Error('No embedding returned from Ollama. Full response: ' + JSON.stringify(data));
}