"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import UnifiedLeadForm from "@/components/buyer/UnifiedLeadForm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  projectId: string;
  projectName: string;
}

const STARTERS = [
  "What's the starting price?",
  "When is possession?",
  "Tell me about amenities",
  "Are 3 BHK flats available?",
];

export default function ChatWidget({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, projectId }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }

      // Show lead form if the bot suggested a callback
      if (assistantText.toLowerCase().includes("callback") || assistantText.toLowerCase().includes("sales team")) {
        setTimeout(() => setShowLeadForm(true), 600);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Unified lead form triggered from chat */}
      {showLeadForm && !open && (
        <UnifiedLeadForm
          projectId={projectId}
          projectName={projectName}
          onClose={() => { setShowLeadForm(false); setLeadDone(true); }}
        />
      )}

      {/* Bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-[88px] sm:bottom-24 right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ background: "#0071e3", color: "#fff" }}
        aria-label="Chat with us"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && messages.length === 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#ff3b30", color: "#fff" }}
          >1</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-[104px] right-2 sm:right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(384px, calc(100vw - 16px))",
            height: "min(440px, calc(100svh - 180px))",
            background: "#fff",
            boxShadow: "rgba(0,0,0,0.24) 0px 20px 60px",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: "#0071e3" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{projectName}</p>
              <p className="text-xs text-white/70">AI Sales Assistant · typically replies instantly</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-3 h-3" style={{ color: "#0071e3" }} />
                  </div>
                  <div className="rounded-2xl rounded-tl-none px-3 py-2 max-w-[80%] text-sm" style={{ background: "#f5f5f7", color: "#1d1d1f" }}>
                    Hi! I&apos;m the AI assistant for {projectName}. What would you like to know?
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 rounded-full text-xs transition-colors"
                      style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3", border: "1px solid rgba(0,113,227,0.2)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-3 h-3" style={{ color: "#0071e3" }} />
                  </div>
                )}
                <div
                  className="rounded-2xl px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "#0071e3", color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#f5f5f7", color: "#1d1d1f", borderTopLeftRadius: 4 }
                  }
                >
                  {msg.content || <span className="opacity-50">…</span>}
                </div>
              </div>
            ))}

            {/* Callback CTA */}
            {showLeadForm && !leadDone && (
              <div className="rounded-2xl p-3" style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "#0071e3" }}>Want a free callback from our team?</p>
                <button
                  onClick={() => { setOpen(false); setTimeout(() => setShowLeadForm(true), 100); }}
                  className="w-full py-1.5 rounded-standard text-xs font-semibold"
                  style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                  Request Callback
                </button>
              </div>
            )}
            {leadDone && (
              <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: "rgba(52,199,89,0.08)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-xs" style={{ color: "#1a7f4a" }}>Callback requested — our team will reach out shortly!</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-t"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this project…"
              className="flex-1 px-3 py-2 rounded-standard text-sm outline-none"
              style={{ background: "#f5f5f7", color: "#1d1d1f" }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
              style={{ background: "#0071e3", color: "#fff", opacity: (!input.trim() || loading) ? 0.4 : 1 }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
