"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildJonContext } from "@/lib/companion/context/buildJonContext";
import type { JonFocusBlock, JonProjectSlice } from "@/lib/companion/context/types";
import { getChatManager } from "@/lib/companion/chat/chatManager";
import type { ChatMessage } from "@/lib/companion/chat/types";
import type { Note } from "@/lib/notes/types";
import type { BlueBookDocument } from "@/types/document";

type JonPanelProps = {
  project?: JonProjectSlice | null;
  document?: BlueBookDocument | null;
  activeBlock?: JonFocusBlock | null;
  notes?: Note[];
};

async function streamJonReply(
  messages: { role: "user" | "jon"; content: string }[],
  creativeContext: string | null,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await fetch("/api/companion/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      ...(creativeContext ? { creativeContext } : {}),
    }),
  });

  if (!response.ok) {
    let detail = "Jon couldn't reply";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        detail = data.error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("Empty response");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onToken(chunk);
    }
  }

  return full;
}

export function JonPanel({
  project = null,
  document = null,
  activeBlock = null,
  notes = [],
}: JonPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const busy = streaming;

  const creative = useMemo(
    () =>
      buildJonContext({
        project,
        document,
        activeBlock,
        notes,
      }),
    [project, document, activeBlock, notes],
  );

  useEffect(() => {
    setMessages(getChatManager().list());
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamText]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy) {
      return;
    }

    setError(null);
    setDraft("");
    const manager = getChatManager();
    manager.append("user", text);
    const next = manager.list();
    setMessages(next);

    setStreaming(true);
    setStreamText("");

    try {
      const payload = next.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const full = await streamJonReply(
        payload,
        creative.text || null,
        (token) => {
          setStreamText((current) => current + token);
        },
      );

      manager.append("jon", full.trim() || "…");
      setMessages(manager.list());
      setStreamText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setStreamText("");
    } finally {
      setStreaming(false);
    }
  }

  function handleClear() {
    getChatManager().clear();
    setMessages([]);
    setStreamText("");
    setError(null);
    setConfirmClear(false);
  }

  const contextProject = creative.label.projectTitle;
  const contextDocument = creative.label.documentTitle;

  return (
    <aside className="flex h-full min-h-0 flex-col border-t border-panel-border bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-cyan text-led-cyan"
            data-lit="true"
            aria-hidden
          />
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            Jon
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="module-button rounded-sm border border-panel-border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-muted uppercase"
            onClick={() => setConfirmClear(true)}
            disabled={busy || messages.length === 0}
            title="Clear conversation"
          >
            Clear
          </button>
          <span className="panel-screw" aria-hidden />
        </div>
      </div>

      <div className="border-b border-panel-border px-3 py-1">
        <p className="font-mono text-[8px] tracking-[0.14em] text-muted uppercase">
          Context
        </p>
        {contextProject || contextDocument ? (
          <div className="mt-0.5 space-y-0.5">
            {contextProject ? (
              <p className="truncate font-mono text-[9px] text-foreground">
                {contextProject}
              </p>
            ) : null}
            {contextDocument ? (
              <p className="truncate font-mono text-[9px] text-led-cyan">
                {contextDocument}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-0.5 font-mono text-[9px] text-muted">—</p>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2"
      >
        {messages.length === 0 && !streamText ? (
          <p className="font-mono text-[9px] leading-relaxed text-muted">
            Jon&apos;s here — brainstorm, argue, vent. Not a writing machine.
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-sm border px-2 py-1.5 font-mono text-[10px] leading-relaxed ${
              message.role === "user"
                ? "ml-3 border-panel-border bg-panel-inset text-foreground"
                : "mr-3 border-panel-border bg-panel-raised text-foreground"
            }`}
          >
            <p className="mb-0.5 font-mono text-[8px] tracking-[0.14em] text-muted uppercase">
              {message.role === "user" ? "You" : "Jon"}
            </p>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        ))}

        {streamText ? (
          <div className="mr-3 rounded-sm border border-panel-border bg-panel-raised px-2 py-1.5 font-mono text-[10px] leading-relaxed text-foreground">
            <p className="mb-0.5 font-mono text-[8px] tracking-[0.14em] text-led-cyan uppercase">
              Jon
            </p>
            <p className="whitespace-pre-wrap break-words">{streamText}</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="border-t border-panel-border px-2 py-1 font-mono text-[8px] leading-relaxed text-[#c45c5c]">
          {error}
        </p>
      ) : null}

      {confirmClear ? (
        <div className="flex items-center gap-1 border-t border-panel-border px-2 py-1.5">
          <p className="min-w-0 flex-1 font-mono text-[8px] text-muted uppercase">
            Clear chat?
          </p>
          <button
            type="button"
            className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[8px] tracking-[0.1em] text-[#c45c5c] uppercase"
            onClick={handleClear}
          >
            Yes
          </button>
          <button
            type="button"
            className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase"
            onClick={() => setConfirmClear(false)}
          >
            No
          </button>
        </div>
      ) : (
        <div className="border-t border-panel-border p-1.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            disabled={busy}
            rows={2}
            placeholder="Talk to Jon…"
            className="w-full resize-none rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-[10px] leading-relaxed text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={busy || !draft.trim()}
            className="module-button mt-1 w-full rounded-sm border border-panel-border px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-foreground uppercase disabled:opacity-40"
            data-active={busy ? "true" : undefined}
          >
            {busy ? "Jon is typing…" : "Send"}
          </button>
        </div>
      )}
    </aside>
  );
}
