import type { ChatRole } from "@/lib/api";

interface Props {
  role: ChatRole;
  content: string;
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow",
          isUser
            ? "bg-accent text-white rounded-br-sm"
            : "bg-surface text-slate-100 rounded-bl-sm",
        ].join(" ")}
      >
        {content || (isUser ? "" : <span className="opacity-60">…</span>)}
      </div>
    </div>
  );
}
