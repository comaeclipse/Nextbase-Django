"use client";

/*
 * Site-wide floating chat launcher.
 *
 * Rendered once from the ROOT layout, so it must survive on the pixel-parity
 * pages (/, /city/[id], /map) that deliberately never load Tailwind/shadcn.
 * That's why every style here is a plain scoped `.vr-chat-*` class from
 * app/styles/floating-chat.css — no Tailwind utilities, no shadcn tokens — and
 * why the panel is a hand-built overlay rather than the shadcn Dialog.
 *
 * The conversation itself reuses the same /api/chat transport as the full
 * /chat page; the launcher is hidden there so the page isn't chatting twice.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import Markdown, { type Components } from "react-markdown";
import { MessageCircle, Send, X } from "lucide-react";

const SUGGESTIONS = [
  "What cities are like Elko, NV?",
  "Somewhere like Elko, NV but warmer with less snow",
  "Best town for a retired vet on a fixed income who hates humidity",
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
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function FloatingChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => ({ model: "gpt-5.1" }) }),
    []
  );
  const { messages, sendMessage, status } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest turn in view as the model streams.
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus the composer on open; close on Escape.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The dedicated /chat page already is the chat, so don't double up there.
  if (pathname === "/chat") return null;

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        className="vr-chat-fab"
        aria-label={open ? "Close chat" : "Ask about cities"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="vr-chat-fab-icon" /> : <MessageCircle className="vr-chat-fab-icon" />}
      </button>

      {open ? (
        <div className="vr-chat-panel" role="dialog" aria-modal="true" aria-label="Ask about cities">
          <header className="vr-chat-head">
            <div className="vr-chat-head-text">
              <strong>Ask about cities</strong>
              <span>Grounded in VetRetire&apos;s data, with honest caveats.</span>
            </div>
            <button
              type="button"
              className="vr-chat-close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="vr-chat-close-icon" />
            </button>
          </header>

          <div className="vr-chat-body">
            {messages.length === 0 ? (
              <div className="vr-chat-suggestions">
                <p className="vr-chat-intro">
                  I answer two things: what&apos;s like a city you name, and the
                  best towns for a person you describe.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="vr-chat-suggestion" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "vr-chat-row vr-chat-row-user" : "vr-chat-row"}
              >
                <div className={m.role === "user" ? "vr-chat-bubble vr-chat-bubble-user" : "vr-chat-bubble"}>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      if (m.role === "assistant") {
                        return (
                          <div key={i} className="vr-chat-md">
                            <Markdown components={markdownComponents}>{part.text}</Markdown>
                          </div>
                        );
                      }
                      return <p key={i}>{part.text}</p>;
                    }
                    if (isToolUIPart(part)) {
                      const running =
                        part.state === "input-streaming" || part.state === "input-available";
                      if (!running) return null;
                      return (
                        <p key={i} className="vr-chat-tool">
                          {TOOL_LABEL[part.type] ?? "Looking things up"}…
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {busy && messages[messages.length - 1]?.role === "user" ? (
              <div className="vr-chat-row">
                <div className="vr-chat-bubble vr-chat-thinking">Thinking…</div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            className="vr-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <input
              ref={inputRef}
              className="vr-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's like Elko, NV? — or describe a person…"
              aria-label="Ask about cities"
            />
            <button
              type="submit"
              className="vr-chat-send"
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <Send className="vr-chat-send-icon" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
