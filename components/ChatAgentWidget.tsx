"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BookCallButton } from "@/components/BookCallButton";

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

function shouldShowBookCallPopup(message: string) {
  const text = message.toLowerCase();
  return text.includes("book a call");
}

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
    <div className="fixed bottom-3 right-3 z-[90] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="flex h-[min(78dvh,680px)] max-h-[calc(100dvh-1.5rem)] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[22px] border-2 border-[#b8cbd1] bg-[#f3ece0] shadow-[0_18px_38px_rgba(5,14,18,0.42)] ring-1 ring-[#d8e4e8]">
          <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
            <div>
              <p className="mono-label text-[10px] text-[#f2d5a2]">AI ASSISTANT</p>
              <p className="text-sm font-semibold text-[#f4f8f9]">
                Project starter chat
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)] ${FOCUS_RING}`}
              aria-label="Close chat"
            >
              x
            </button>
          </header>

          <div
            ref={threadRef}
            className="chat-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#d2dce1] px-4 py-4 pr-3"
          >
            {messages.map((message) => {
              const showBookCallPopup =
                message.role === "assistant" &&
                shouldShowBookCallPopup(message.content);

              return (
                <div key={message.id} className={showBookCallPopup ? "space-y-2" : ""}>
                  <div
                    className={`max-w-[88%] rounded-[14px] border-2 px-3 py-2 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)]"
                        : `ml-auto border-[#bf6548] bg-[#f2d5a2] text-[#2f271f] ${
                            message.id === lastUserMessageId
                              ? "ring-2 ring-[#d87b5d] shadow-[0_6px_14px_rgba(20,8,4,0.28)]"
                              : ""
                          }`
                    }`}
                  >
                    {message.content}
                  </div>

                  {showBookCallPopup ? (
                    <div className="max-w-[88%]">
                      <BookCallButton
                        label="Book a call now"
                        className={`pixel-notch inline-flex w-full items-center justify-center rounded-full border-2 border-[#8a3f2f] bg-[var(--color-accent-warm)] px-4 py-2.5 text-sm font-semibold text-[#1d1b1a] shadow-[0_8px_16px_rgba(20,8,4,0.32)] transition hover:brightness-105 ${FOCUS_RING}`}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {isSending ? (
              <div className="inline-flex items-center gap-2 rounded-[14px] border-2 border-[#bfced4] bg-[#f3ede2] px-3 py-2 text-xs text-[#4b6670]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#d87b5d]" />
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#9eb2ba] bg-[#c4d0d5] px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2 rounded-[12px] border border-[#97abb4] bg-[#b3c2c8] p-2">
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
                      ? "border-[#bf6548] bg-[#f2d5a2] font-semibold text-[#2f271f] shadow-[0_4px_10px_rgba(20,8,4,0.2)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-accent-soft)] hover:text-[var(--color-text)]"
                  } ${FOCUS_RING}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 rounded-[14px] border-2 border-[#7e98a2] bg-[#d3dee3] p-2"
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
                className={`h-11 min-w-0 flex-1 rounded-[12px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] ${FOCUS_RING}`}
                aria-label="Message assistant"
              />
              <button
                type="submit"
                disabled={!canSend}
                className={`inline-flex h-11 items-center justify-center rounded-[12px] border-2 border-[#8a3f2f] bg-[#d87b5d] px-4 text-sm font-semibold text-[#1d1b1a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
              >
                Send
              </button>
            </form>

            {error ? (
              <p className="mt-2 text-xs text-[#8a3f2f]">{error}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isOpen ? (
        <p className="mb-2 mr-1 inline-flex rounded-full border border-[#f2be9c] bg-[#7b3b2d] px-3 py-1 text-[11px] font-medium text-[#fff4ea] shadow-[0_8px_18px_rgba(21,7,3,0.45)]">
          Need a quote? Ask AI
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`pixel-notch relative mt-1 inline-flex items-center gap-2 rounded-full border-2 border-[#8a3f2f] bg-[var(--color-accent-warm)] px-5 py-3 text-sm font-semibold text-[#1d1b1a] shadow-[0_12px_24px_rgba(21,7,3,0.46)] ring-2 ring-[#f1b896]/65 transition hover:brightness-105 ${FOCUS_RING}`}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {!isOpen ? (
          <>
            <span className="pointer-events-none absolute -inset-1 -z-10 animate-pulse rounded-full border border-[#f3c6aa] opacity-80" />
            <span className="pointer-events-none absolute -inset-2 -z-20 animate-pulse rounded-full border border-[#d57455]/70 [animation-delay:140ms]" />
          </>
        ) : null}
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#f7d4be] bg-[#93432f] px-1 text-[9px] font-bold text-[#fff4ea]">
          AI
        </span>
        Ask AI
      </button>
    </div>
  );
}
