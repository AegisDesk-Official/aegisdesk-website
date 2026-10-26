"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusChip } from "@/components/ui/status-chip";
import { siteConfig } from "@/lib/site-config";
import {
  DEMO_LIMITS,
  type DemoAnswer,
  type DemoApiError,
  type DemoApiSuccess,
  type DemoCitation,
} from "@/lib/validation/demo-types";
import { DemoGateModal, type DemoGateValues } from "./demo-gate-modal";
import { useTurnstile } from "@/lib/security/use-turnstile";

const STORAGE_KEY = "aegis_demo_user";
const CHIPS = [
  "What is your return policy on opened headphones?",
  "Can I cancel an order after 2 hours?",
  "Do you ship to military APO addresses?",
];

interface StoredUser {
  email: string;
  phone: string;
}

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; answer: DemoAnswer }
  | { id: number; role: "error"; text: string; bookCall: boolean };

function readStoredUser(): StoredUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredUser>;
    return typeof v.email === "string" && typeof v.phone === "string" ? { email: v.email, phone: v.phone } : null;
  } catch {
    return null;
  }
}
function writeStoredUser(user: StoredUser | null) {
  try {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
}

/** Verified answers get the emerald badge. Escalations get the amber one. */
function AnswerBadge({ escalated }: { escalated: boolean }) {
  if (escalated) {
    return (
      <StatusChip variant="warn" indicator>
        Routed to human team
      </StatusChip>
    );
  }
  return (
    <StatusChip variant="verified" indicator>
      Backed by policy source
    </StatusChip>
  );
}

/** Monospace citation pill with interactive hover */
function CitationChip({
  citation,
  index,
  escalated,
  onHover,
}: {
  citation: DemoCitation;
  index: number;
  escalated: boolean;
  onHover?: (citation: DemoCitation | null) => void;
}) {
  return (
    <li
      onMouseEnter={() => onHover?.(citation)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(citation)}
      onBlur={() => onHover?.(null)}
      tabIndex={0}
      className="group cursor-pointer rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5 transition-colors hover:border-[var(--line-strong)] focus:border-[var(--line-strong)] focus:outline-none"
    >
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
        <span className={escalated ? "text-[var(--warn)]" : "text-[var(--verified)]"}>
          [{index + 1}]
        </span>
        <span className="font-medium text-[var(--text)] group-hover:underline">
          {citation.source}
        </span>
        {typeof citation.page === "number" && (
          <span className="text-[var(--text-dim)]">· p.{citation.page}</span>
        )}
      </div>
      {citation.snippet && (
        <p className="mt-1 line-clamp-2 border-l border-[var(--line-strong)] pl-2 font-mono text-[11px] leading-relaxed text-[var(--text-dim)]">
          {citation.snippet}
        </p>
      )}
    </li>
  );
}

function AssistantMessage({
  answer,
  onCitationHover,
}: {
  answer: DemoAnswer;
  onCitationHover?: (citation: DemoCitation | null) => void;
}) {
  const escalated = answer.escalated;
  const score =
    typeof answer.groundingScore === "number" && Number.isFinite(answer.groundingScore)
      ? Math.min(1, Math.max(0, answer.groundingScore))
      : null;

  return (
    <article
      className={`rounded-[12px] border ${
        escalated ? "border-[var(--warn)]/40" : "border-[var(--verified)]/30"
      } bg-[var(--surface-2)] p-4`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
        <AnswerBadge escalated={escalated} />
        {score !== null && (
          <span className="font-mono text-[12px] tracking-[0.06em] text-[var(--text-dim)] tabular-nums">
            MATCH {(score * 100).toFixed(1)}%
          </span>
        )}
      </header>

      <p className="pt-3 text-[15px] font-light leading-relaxed text-[var(--text)]">
        {answer.answer}
      </p>

      {answer.citations.length > 0 && (
        <div className="mt-3 border-t border-[var(--line)] pt-2.5">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-dim)] tabular-nums">
            CITATIONS [{answer.citations.length}]
          </p>
          <ul className="space-y-2">
            {answer.citations.map((c, i) => (
              <CitationChip
                key={`${c.source}-${c.page ?? 0}-${i}`}
                citation={c}
                index={i}
                escalated={escalated}
                onHover={onCitationHover}
              />
            ))}
          </ul>
        </div>
      )}

      {escalated && (
        <p className="mt-2.5 border-t border-[var(--line)] pt-2 font-mono text-[11px] text-[var(--warn)]">
          Evidence threshold not met: routed to human tier-2 support.
        </p>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Demo chat                                                           */
/* ------------------------------------------------------------------ */

export interface DemoChatProps {
  onCitationHover?: (citation: DemoCitation | null) => void;
}

export function DemoChat({ onCitationHover }: DemoChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnstile = useTurnstile(siteConfig.turnstileSiteKey);

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const nextId = () => ++idRef.current;
  const limitReached = remaining === 0;

  const ask = useCallback(
    async (text: string, who: StoredUser, extra: { company?: string; honeypot?: string } = {}) => {
      setLoading(true);
      setMessages((m) => [...m, { id: nextId(), role: "user", text }]);

      const addError = (message: string, bookCall = false) =>
        setMessages((m) => [...m, { id: nextId(), role: "error", text: message, bookCall }]);

      if (turnstile.enabled && !turnstile.getToken()) {
        addError("The security check is still loading. Wait a moment and send again.");
        setInput(text);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            email: who.email,
            phone: who.phone,
            company: extra.company ?? "",
            website: extra.honeypot ?? "",
            consent: true,
            turnstileToken: turnstile.getToken() ?? undefined,
          }),
        });
        const data = (await res.json().catch(() => null)) as (DemoApiSuccess & DemoApiError) | null;

        if (res.ok && data && typeof data.answer === "string") {
          setMessages((m) => [...m, { id: nextId(), role: "assistant", answer: data }]);
          if (typeof data.remaining === "number") setRemaining(data.remaining);
        } else if (res.status === 429) {
          setRemaining(0);
          addError(data?.error ?? "You have reached the demo limit.", true);
        } else {
          addError(data?.error ?? "Something went wrong. Please try again.", res.status === 503);
          setInput(text);
        }
      } catch {
        addError("Could not reach the demo. Check your connection and try again.");
        setInput(text);
      } finally {
        turnstile.reset();
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turnstile.enabled, turnstile.getToken, turnstile.reset]
  );

  function submit() {
    const text = input.trim();
    if (!text || loading || limitReached) return;
    setInput("");
    const stored = user ?? readStoredUser();
    if (!stored) {
      setPending(text);
      setGateOpen(true);
      return;
    }
    void ask(text, stored);
  }

  function handleGateSubmit(values: DemoGateValues) {
    const who = { email: values.email, phone: values.phone };
    writeStoredUser(who);
    setUser(who);
    setGateOpen(false);
    const text = pending;
    setPending("");
    if (text) void ask(text, who, { company: values.company, honeypot: values.honeypot });
  }

  function handleGateClose() {
    setGateOpen(false);
    if (pending) setInput(pending);
    setPending("");
  }

  function changeDetails() {
    writeStoredUser(null);
    setUser(null);
    setRemaining(null);
    inputRef.current?.focus();
  }

  const counter = input.length;
  const overLimit = counter > DEMO_LIMITS.maxMessageChars;

  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] shadow-none">
      {/* Terminal header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
            KNOWLEDGE_BASE
          </p>
          <p className="mt-0.5 text-xs font-medium text-[var(--text)]">
            Aegis Retail Electronics Policy &amp; FAQ
          </p>
        </div>
        <StatusChip variant="verified" indicator>
          RAG INSPECTOR
        </StatusChip>
      </div>

      {/* Conversation log */}
      <div
        ref={scrollRef}
        className="max-h-[22rem] min-h-[12rem] space-y-3.5 overflow-y-auto p-4 [scrollbar-color:rgba(214,235,224,0.15)_transparent] [scrollbar-width:thin]"
        role="log"
        aria-live="polite"
        aria-label="Demo conversation"
      >
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <p className="text-xs text-[var(--text-dim)]">
              Ask a question the way a customer would. Or select a sample query:
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sample questions">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={loading || limitReached}
                  onClick={() => {
                    setInput(chip);
                    inputRef.current?.focus();
                  }}
                  className="flex items-start gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-left font-mono text-[11px] text-[var(--text-dim)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--line-strong)] disabled:opacity-50"
                >
                  <span aria-hidden="true" className="text-[var(--verified)]">
                    &gt;
                  </span>
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex flex-col items-end gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  CUSTOMER
                </span>
                <div className="w-fit max-w-[88%] rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-light text-[var(--text)]">
                  {m.text}
                </div>
              </div>
            );
          }
          if (m.role === "assistant") {
            return (
              <AssistantMessage
                key={m.id}
                answer={m.answer}
                onCitationHover={onCitationHover}
              />
            );
          }
          return (
            <div
              key={m.id}
              role="alert"
              className="space-y-1.5 rounded-[10px] border border-[var(--blocked)]/40 bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--blocked)]">
                SYSTEM NOTICE
              </p>
              <p>{m.text}</p>
              {m.bookCall && (
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-[var(--paper)] underline underline-offset-4 hover:opacity-80"
                >
                  Contact our team &rarr;
                </a>
              )}
            </div>
          );
        })}

        {loading && (
          <p className="flex items-center gap-2 font-mono text-xs text-[var(--text-dim)]" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--verified)]" aria-hidden="true" />
            Checking your documents and finding citations...
          </p>
        )}
      </div>

      {/* Command line */}
      <div className="space-y-2.5 border-t border-[var(--line)] bg-[var(--surface)] p-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <label htmlFor="demo-question" className="sr-only">
              Your question
            </label>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2 left-3 font-mono text-xs text-[var(--text-faint)] select-none"
            >
              &gt;
            </span>
            <textarea
              id="demo-question"
              ref={inputRef}
              rows={2}
              value={input}
              maxLength={DEMO_LIMITS.maxMessageChars}
              disabled={loading || limitReached}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={limitReached ? "Demo limit reached" : "Ask a question about the sample policies"}
              className="w-full resize-none rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] py-2 pr-3 pl-7 font-mono text-xs text-[var(--text)] transition-colors placeholder:text-[var(--text-faint)] focus-visible:border-[var(--line-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="Send question"
            disabled={!input.trim() || loading || limitReached}
            className="h-[3.1rem] w-10 shrink-0 rounded-[10px] bg-[var(--paper)] text-[var(--paper-ink)] transition-colors hover:bg-white disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--text-dim)]">
          <span className="tabular-nums">
            {remaining === null
              ? `${DEMO_LIMITS.perEmail} questions allowed`
              : `${remaining} of ${DEMO_LIMITS.perEmail} questions left`}
            {user && (
              <>
                <span aria-hidden="true" className="mx-2 text-[var(--text-faint)]">
                  |
                </span>
                <button
                  type="button"
                  onClick={changeDetails}
                  className="underline underline-offset-2 hover:text-white"
                >
                  Change details
                </button>
              </>
            )}
          </span>
          <span className={`tabular-nums ${overLimit ? "text-[var(--blocked)]" : ""}`} aria-live="off">
            {counter}/{DEMO_LIMITS.maxMessageChars}
          </span>
        </div>

        {turnstile.enabled && <div ref={turnstile.containerRef} />}
      </div>

      <DemoGateModal isOpen={gateOpen} onClose={handleGateClose} onSubmit={handleGateSubmit} />
    </div>
  );
}

export default DemoChat;
