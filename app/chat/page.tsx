"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";

const SUGGESTIONS = [
  "What cities are like Elko, NV?",
  "Somewhere like Elko, NV but warmer with less snow",
  "Best town for a retired vet on a fixed income who hates humidity and needs VA care",
  "Where's good for a remote worker who wants mountains and a walkable downtown?",
];

const TOOL_LABEL: Record<string, string> = {
  "tool-find_similar_cities": "Finding similar cities",
  "tool-match_person_to_cities": "Ranking cities for this person",
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ask about cities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grounded in VetRetire&apos;s data. I answer two things: <em>what&apos;s like a city you
          name</em>, and <em>the best towns for a person you describe</em> — with honest caveats.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-card-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                  : "max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-foreground"
              }
            >
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                if (isToolUIPart(part)) {
                  const label = TOOL_LABEL[part.type] ?? "Looking things up";
                  const done = part.state === "output-available";
                  const errored =
                    part.state === "output-available" &&
                    part.output != null &&
                    typeof part.output === "object" &&
                    "error" in (part.output as Record<string, unknown>);
                  return (
                    <p key={i} className="my-1 text-xs italic text-muted-foreground">
                      {errored ? "⚠ " : done ? "✓ " : "… "}
                      {label}
                      {errored ? " — no match, retrying" : done ? "" : "…"}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="sticky bottom-0 mt-4 flex gap-2 bg-background py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask: what's like Elko, NV? — or describe a person…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
