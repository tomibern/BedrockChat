"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ disabled = false, onSend }: Props) {
  const [text, setText] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-slate-800 bg-background p-3"
    >
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Escribí tu mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
        className="max-h-40 flex-1 resize-none rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-accent"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-110"
      >
        Enviar
      </button>
    </form>
  );
}
