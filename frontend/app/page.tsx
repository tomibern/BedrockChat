"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import ModelSelector from "@/components/ModelSelector";
import {
  fetchModels,
  streamChat,
  type ChatMessage,
  type ModelInfo,
} from "@/lib/api";

export default function HomePage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels()
      .then((m) => {
        setModels(m);
        if (m.length > 0) setSelectedModel(m[0].id);
      })
      .catch((e) => setError(`No se pudo cargar modelos: ${e.message}`));
  }, []);

  const handleSend = async (text: string) => {
    if (!selectedModel || streaming) return;
    setError(null);

    const history = messages;
    const nextUser: ChatMessage = { role: "user", content: text };
    const placeholder: ChatMessage = { role: "assistant", content: "" };
    setMessages([...history, nextUser, placeholder]);
    setStreaming(true);

    try {
      await streamChat(text, history, selectedModel, (chunk) => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content: last.content + chunk,
            };
          }
          return copy;
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          copy.pop();
        }
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const clearConversation = () => {
    if (streaming) return;
    setMessages([]);
    setError(null);
  };

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 bg-surface/80 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-base font-semibold">AI Chat Assistant</h1>
          <p className="text-xs text-slate-400">Claude vía AWS Bedrock</p>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            models={models}
            value={selectedModel}
            onChange={setSelectedModel}
            disabled={streaming}
          />
          <button
            onClick={clearConversation}
            disabled={streaming || messages.length === 0}
            className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b border-red-800 bg-red-950/60 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <ChatWindow messages={messages} streaming={streaming} />

      {streaming && (
        <div className="px-4 pb-1 text-center text-xs text-slate-500">
          Generando respuesta…
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={streaming || !selectedModel} />
    </main>
  );
}
