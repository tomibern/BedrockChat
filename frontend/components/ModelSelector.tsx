"use client";

import type { ModelInfo } from "@/lib/api";

interface Props {
  models: ModelInfo[];
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  models,
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || models.length === 0}
      className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-accent disabled:opacity-50"
    >
      {models.length === 0 && <option value="">Cargando…</option>}
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
