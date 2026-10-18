"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/ui";

type ReminderState = "DRAFT" | "BUSY" | "APPROVED" | "REJECTED" | "ERROR";
type Reminder = { id: string; message: string; state: ReminderState; error?: string };
type Msg = { role: "user" | "assistant"; text: string; tool?: string; source?: string; reminder?: Reminder };

const SUGGESTIONS = [
  "Mera low stock batao",
  "Aaj ki total sales kitni hain?",
  "Kin customers ki payments pending hain?",
  "Ali ko payment reminder bana do",
];

const btnBase =
  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ m }: { m: Msg }) {
  if (!m.tool && !m.source) return null;
  const ai = m.source === "fallback" ? "mode: keyword (AI quota khatam)" : m.source ? `AI: ${m.source}` : "";
  const tool = m.tool ? `tool: ${m.tool}` : "";
  const text = [ai, tool].filter(Boolean).join(" | ");
  const tone = m.source === "fallback" ? "warn" : m.source ? "good" : "neutral";
  return (
    <div className="mt-1.5">
      <Badge tone={tone}>{text}</Badge>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalam o Alaikum! Main AI Saathi hoon. Stock, sales aur customers ki payments ke baare mein poochein." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function patchReminder(index: number, patch: Partial<Reminder>) {
    setMessages((all) =>
      all.map((m, i) => (i === index && m.reminder ? { ...m, reminder: { ...m.reminder, ...patch } } : m))
    );
  }

  async function decide(index: number, id: string, action: "approve" | "reject") {
    patchReminder(index, { state: "BUSY", error: undefined });
    try {
      const res = await fetch(`/api/reminders/${id}/${action}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        patchReminder(index, { state: "ERROR", error: d.error ?? "Masla aaya." });
        return;
      }
      patchReminder(index, { state: action === "approve" ? "APPROVED" : "REJECTED" });
    } catch {
      patchReminder(index, { state: "ERROR", error: "Network ka masla aaya." });
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard na mile to ignore */
    }
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })) }),
      });
      const d = await res.json();
      const rd = d.tool === "draft_payment_reminder" ? d.data : null;
      const reminder: Reminder | undefined =
        rd && rd.reminderId && rd.message
          ? { id: rd.reminderId, message: rd.message, state: "DRAFT" }
          : undefined;
      setMessages((m) => [...m, { role: "assistant", text: d.reply ?? d.error ?? "Jawab nahi mila.", tool: d.tool, source: d.source, reminder }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network ka masla aaya. Dobara koshish karein." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <header className="mb-3">
          <h1 className="font-display text-3xl leading-tight">AI Saathi assistant</h1>
          <p className="mt-1 text-sm text-muted">
            Jawab aap ke apne records se aate hain. Reminder sirf draft banta hai.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-line-2 bg-white px-3.5 py-1.5 text-sm text-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div
          role="log"
          aria-live="polite"
          aria-label="Baat cheet"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-sm shadow-ink/5 sm:p-5"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[90%] sm:max-w-[82%]">
                <div
                  className={`whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-paper"
                      : "rounded-2xl rounded-bl-sm border border-line bg-paper px-4 py-3"
                  }`}
                >
                  {m.text}
                </div>

                {m.role === "assistant" && <StatusBadge m={m} />}

                {m.reminder && (
                  <div className="mt-2.5 rounded-xl border border-line bg-white p-3">
                    {(m.reminder.state === "DRAFT" || m.reminder.state === "BUSY" || m.reminder.state === "ERROR") && (
                      <>
                        <p className="mb-2.5 text-xs text-muted">
                          Ye sirf draft hai. Manzoor karne par bhi message khud nahi bheja jata.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decide(i, m.reminder!.id, "approve")}
                            disabled={m.reminder.state === "BUSY"}
                            className={`${btnBase} bg-good text-white hover:bg-[#185a30]`}
                          >
                            Manzoor karein
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(i, m.reminder!.id, "reject")}
                            disabled={m.reminder.state === "BUSY"}
                            className={`${btnBase} border border-bad text-bad hover:bg-bad-bg`}
                          >
                            Radd karein
                          </button>
                          {m.reminder.state === "BUSY" && <span className="text-xs text-muted">Ruk jayein...</span>}
                          {m.reminder.state === "ERROR" && (
                            <span role="alert" className="text-xs text-bad">{m.reminder.error}</span>
                          )}
                        </div>
                      </>
                    )}
                    {m.reminder.state === "APPROVED" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-good">Manzoor ho gaya. Ab aap isay khud bhej sakte hain.</span>
                        <button
                          type="button"
                          onClick={() => copyText(m.reminder!.message)}
                          className={`${btnBase} bg-ink text-white hover:bg-ink-2`}
                        >
                          {copied ? "Copy ho gaya" : "Message copy karein"}
                        </button>
                      </div>
                    )}
                    {m.reminder.state === "REJECTED" && (
                      <span className="text-sm text-bad">Radd kar diya gaya. Ye nahi bheja jayega.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div role="status" className="flex items-center gap-2 text-sm text-muted">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    className="size-1.5 rounded-full bg-muted motion-safe:animate-bounce"
                    style={{ animationDelay: `${n * 120}ms` }}
                  />
                ))}
              </span>
              AI Saathi soch raha hai...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apna sawal likhein..."
            maxLength={500}
            aria-label="Apna sawal"
            className="min-w-0 flex-1 rounded-xl border border-line-2 bg-white px-4 py-3 text-base text-ink outline-none transition-shadow placeholder:text-[#7a869e] hover:border-[#9fb0d0] focus:border-ink focus-visible:ring-4 focus-visible:ring-ink/10"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-ink px-5 py-3 text-base font-medium text-white transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bhejein
          </button>
        </form>
      </main>
    </>
  );
}
