"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const SUGGESTIONS = [
  "How do I get started?",
  "How much does a website cost?",
  "I need a church website in 4 weeks.",
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I can help you get started. Tell me what kind of website you need, your timeline, and I'll suggest the next best step.",
};

export function ChatAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const sendMessage = async (
    nextText: string,
    options?: {
      fromSuggestion?: boolean;
    }
  ) => {
    const content = nextText.trim();
    if (!content || isSending) {
      return;
    }

    setActiveSuggestion(options?.fromSuggestion ? content : null);

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content,
    };
    setLastUserMessageId(userMessage.id);

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const payload = (await res.json()) as { reply?: string; error?: string };
      const reply =
        (payload.reply || "").trim() ||
        "I can still help. Please share your project goal, timeline, and page count.";

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: reply,
        },
      ]);

      if (!res.ok && payload.error) {
        setError(payload.error);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Use Book a call and we can continue there.",
        },
      ]);
      setError("Network error while contacting the assistant.");
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input, { fromSuggestion: false });
  };

  useEffect(() => {
    if (!isOpen || !threadRef.current) {
      return;
    }

    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending, isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="w-[min(94vw,420px)] overflow-hidden rounded-[22px] border-2 border-[var(--color-accent)] bg-[var(--color-surface)] shadow-[0_16px_34px_rgba(5,14,18,0.44)] ring-2 ring-[var(--color-accent)]">
          <header className="flex items-center justify-between border-b-2 border-[var(--color-border)] bg-[var(--color-band)] px-4 py-3">
            <div>
              <p className="mono-label text-[10px] text-[var(--color-accent)]">AI ASSISTANT</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Project starter chat
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] ${FOCUS_RING}`}
              aria-label="Close chat"
            >
              x
            </button>
          </header>

          <div
            ref={threadRef}
            className="chat-scrollbar max-h-[min(56vh,460px)] space-y-3 overflow-y-auto px-4 py-4 pr-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-[14px] border-2 px-3 py-2 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                    : `ml-auto border-[var(--color-accent-deep)] bg-[var(--color-accent)] text-[#2c2f2d] ${
                        message.id === lastUserMessageId
                          ? "ring-2 ring-[var(--color-accent-warm)] shadow-[0_6px_14px_rgba(20,8,4,0.32)]"
                          : ""
                      }`
                }`}
              >
                {message.content}
              </div>
            ))}

            {isSending ? (
              <div className="inline-flex items-center gap-2 rounded-[14px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-muted)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t-2 border-[var(--color-accent)] bg-[var(--color-band)] px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    void sendMessage(suggestion, { fromSuggestion: true });
                  }}
                  aria-pressed={activeSuggestion === suggestion}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    activeSuggestion === suggestion
                      ? "border-[var(--color-accent-deep)] bg-[var(--color-accent)] font-semibold text-[#2c2f2d] shadow-[0_4px_10px_rgba(20,8,4,0.25)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
                  } ${FOCUS_RING}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 rounded-[14px] border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-2"
            >
              <input
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (activeSuggestion) {
                    setActiveSuggestion(null);
                  }
                }}
                placeholder="Type your project details..."
                className={`h-11 min-w-0 flex-1 rounded-[12px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text)] placeholder:text-[#dbe8e9] ${FOCUS_RING}`}
                aria-label="Message assistant"
              />
              <button
                type="submit"
                disabled={!canSend}
                className={`inline-flex h-11 items-center justify-center rounded-[12px] border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[#2c2f2d] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
              >
                Send
              </button>
            </form>

            {error ? (
              <p className="mt-2 text-xs text-[var(--color-accent-warm)]">{error}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isOpen ? (
        <p className="mb-2 mr-1 inline-flex rounded-full border border-[var(--color-accent)] bg-[var(--color-band)] px-3 py-1 text-[11px] font-medium text-[var(--color-text)] shadow-[0_8px_18px_rgba(4,11,15,0.4)]">
          Need a quote? Ask AI
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`pixel-notch relative mt-1 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[#2c2f2d] shadow-[0_12px_24px_rgba(6,14,20,0.5)] transition hover:brightness-105 ${FOCUS_RING}`}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {!isOpen ? (
          <span className="pointer-events-none absolute -inset-1 -z-10 animate-pulse rounded-full border border-[var(--color-accent)] opacity-75" />
        ) : null}
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent-deep)]" />
        Ask AI
      </button>
    </div>
  );
}
