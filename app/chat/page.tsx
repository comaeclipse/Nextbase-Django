"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import Markdown, { type Components } from "react-markdown";

const MODEL_OPTIONS = [
  { id: "gpt-5.1", label: "GPT-5.1" },
  { id: "gpt-5.1-mini", label: "GPT-5.1 mini" },
  { id: "gpt-5.1-nano", label: "GPT-5.1 nano" },
];

const SUGGESTIONS = [
  "What cities are like Elko, NV?",
  "Somewhere like Elko, NV but warmer with less snow",
  "Best town for a retired vet on a fixed income who hates humidity and needs VA care",
  "I'm a retired Navy electrician — what civilian jobs fit?",
];

const TOOL_LABEL: Record<string, string> = {
  "tool-find_similar_cities": "Finding similar cities",
  "tool-match_person_to_cities": "Ranking cities for this person",
  "tool-estimate_cost_of_living": "Estimating monthly cost of living",
  "tool-compare_state_taxes_and_gas": "Comparing state taxes and gas prices",
  "tool-compare_state_gun_freedom": "Comparing state gun-law protections",
  "tool-explore_military_career": "Matching your military job to civilian work",
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: selectedModel }),
      }),
    [selectedModel],
  );
  const { messages, sendMessage, status } = useChat({ transport });
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
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ask about cities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grounded in VetRetire&apos;s data. I answer two things: <em>what&apos;s like a city you
            name</em>, and <em>the best towns for a person you describe</em> - with honest caveats.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          Model
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={busy}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {MODEL_OPTIONS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
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
                  if (m.role === "assistant") {
                    return (
                      <div key={i} className="text-sm [&_p]:whitespace-pre-wrap">
                        <Markdown components={markdownComponents}>{part.text}</Markdown>
                      </div>
                    );
                  }
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                if (isToolUIPart(part)) {
                  const label = TOOL_LABEL[part.type] ?? "Looking things up";
                  const running =
                    part.state === "input-streaming" || part.state === "input-available";
                  // Show status only while a tool is in flight; hide completed/error chrome.
                  if (!running) return null;
                  return (
                    <p key={i} className="my-1 text-xs italic text-muted-foreground">
                      {label}…
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
            <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">Thinking...</div>
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
          placeholder="Ask: what's like Elko, NV? - or describe a person..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
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
