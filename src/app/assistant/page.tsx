"use client";

import Nav from "@/components/Nav";

import { useEffect, useRef, useState } from "react";

type ReminderState = "DRAFT" | "BUSY" | "APPROVED" | "REJECTED" | "ERROR";
type Reminder = { id: string; message: string; state: ReminderState; error?: string };
type Msg = { role: "user" | "assistant"; text: string; tool?: string; reminder?: Reminder };

const SUGGESTIONS = [
  "Mera low stock batao",
  "Aaj ki total sales kitni hain?",
  "Kin customers ki payments pending hain?",
  "Ali ko payment reminder bana do",
];

const box = { border: "1px solid #fff", borderRadius: 12 } as const;
const btn = { borderRadius: 8, padding: "6px 14px", border: "none", cursor: "pointer", color: "#fff", fontSize: 13 } as const;

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalam o Alaikum! Main AI Saathi hoon. Stock, sales aur customers ki payments ke baare mein poochein." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setMessages((m) => [...m, { role: "assistant", text: d.reply ?? d.error ?? "Jawab nahi mila.", tool: d.tool, reminder }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network ka masla aaya. Dobara koshish karein." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <Nav />
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24, color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>AI Saathi assistant</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={loading}
            style={{ ...box, padding: "6px 12px", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13 }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ ...box, flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, minHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{ background: m.role === "user" ? "#2b3a67" : "#1a1a1a", borderRadius: 12, padding: "10px 14px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {m.text}
            </div>
            {m.tool && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>tool: {m.tool}</div>}

            {m.reminder && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {(m.reminder.state === "DRAFT" || m.reminder.state === "BUSY" || m.reminder.state === "ERROR") && (
                  <>
                    <button onClick={() => decide(i, m.reminder!.id, "approve")} disabled={m.reminder.state === "BUSY"}
                      style={{ ...btn, background: "#1f7a4d" }}>
                      Manzoor karein
                    </button>
                    <button onClick={() => decide(i, m.reminder!.id, "reject")} disabled={m.reminder.state === "BUSY"}
                      style={{ ...btn, background: "#8a2f2f" }}>
                      Radd karein
                    </button>
                    {m.reminder.state === "BUSY" && <span style={{ fontSize: 12, opacity: 0.7 }}>Ruk jayein...</span>}
                    {m.reminder.state === "ERROR" && <span style={{ fontSize: 12, color: "#ff8a8a" }}>{m.reminder.error}</span>}
                  </>
                )}
                {m.reminder.state === "APPROVED" && (
                  <>
                    <span style={{ fontSize: 13, color: "#6fdc9c" }}>Manzoor ho gaya. Ab aap isay khud bhej sakte hain.</span>
                    <button onClick={() => copyText(m.reminder!.message)} style={{ ...btn, background: "#2b3a67" }}>
                      {copied ? "Copy ho gaya" : "Message copy karein"}
                    </button>
                  </>
                )}
                {m.reminder.state === "REJECTED" && (
                  <span style={{ fontSize: 13, color: "#ff8a8a" }}>Radd kar diya gaya. Ye nahi bheja jayega.</span>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div style={{ opacity: 0.6, fontSize: 14 }}>AI Saathi soch raha hai...</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Apna sawal likhein..."
          maxLength={500}
          style={{ ...box, flex: 1, padding: "10px 14px", background: "transparent", color: "#fff" }}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          style={{ borderRadius: 12, padding: "10px 20px", background: "#2b3a67", color: "#fff", border: "none", cursor: "pointer" }}>
          Bhejein
        </button>
      </div>
    </main>
    </>
  );
}

