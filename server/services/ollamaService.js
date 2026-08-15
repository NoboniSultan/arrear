// Thin wrapper around Ollama's local HTTP API. No LangChain or other
// framework — just fetch. Requires Node 18+ (global fetch) and a running
// `ollama serve` with OLLAMA_MODEL already pulled.

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

async function generateText(prompt, { model = OLLAMA_MODEL } = {}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.response;
}

module.exports = { generateText };
