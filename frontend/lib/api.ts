export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BACKEND_URL}/models`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /models failed: ${res.status}`);
  const data = (await res.json()) as { models: ModelInfo[] };
  return data.models;
}

export async function sendChat(
  message: string,
  history: ChatMessage[],
  model: string,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, model }),
  });
  if (!res.ok) throw new Error(`POST /chat failed: ${res.status}`);
  const data = (await res.json()) as { response: string };
  return data.response;
}

/**
 * Stream chat response via SSE. onChunk is called for each token chunk.
 * Returns the full accumulated response.
 */
export async function streamChat(
  message: string,
  history: ChatMessage[],
  model: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({
    message,
    model,
    history: JSON.stringify(history),
  });
  const res = await fetch(`${BACKEND_URL}/stream?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`GET /stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");
      let eventName = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      if (eventName === "error") {
        try {
          const parsed = JSON.parse(dataStr) as { error?: string };
          throw new Error(parsed.error ?? "stream error");
        } catch {
          throw new Error("stream error");
        }
      }
      if (eventName === "done") return full;
      try {
        const parsed = JSON.parse(dataStr) as { text?: string };
        if (parsed.text) {
          full += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // ignore non-JSON data lines
      }
    }
  }

  return full;
}
