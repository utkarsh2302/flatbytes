"use client";

import { useState, useTransition } from "react";
import { Phone, User, X, CheckCircle } from "lucide-react";
import { submitLead } from "@/lib/actions";

interface Props {
  projectId: string;
  projectName: string;
}

export default function StickyContactBar({ projectId, projectName }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await submitLead({ project_id: projectId, name, phone, source: "sticky_cta" });
        setDone(true);
        setTimeout(() => { setExpanded(false); setDone(false); setName(""); setPhone(""); }, 3000);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <>
      {/* Desktop pill — fixed bottom-right */}
      <div
        className="hidden lg:block fixed bottom-6 right-6 z-40"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
      >
        {expanded ? (
          <div
            className="rounded-2xl p-5 w-72"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>
                Talk to sales
              </p>
              <button onClick={() => setExpanded(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "rgba(0,0,0,0.4)" }} />
              </button>
            </div>
            {done ? (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle className="w-5 h-5" style={{ color: "#1cc77f" }} />
                <span className="text-caption" style={{ color: "#1d1d1f" }}>We&apos;ll call you shortly!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.3)" }} />
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full pl-8 pr-3 py-2 rounded-standard text-sm outline-none"
                    style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.06)", color: "#1d1d1f" }} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.3)" }} />
                  <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    className="w-full pl-8 pr-3 py-2 rounded-standard text-sm outline-none"
                    style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.06)", color: "#1d1d1f" }} />
                </div>
                {error && <p className="text-micro" style={{ color: "#ff3b30" }}>{error}</p>}
                <button type="submit" disabled={isPending}
                  className="w-full py-2 rounded-standard text-sm font-semibold"
                  style={{ background: "#0071e3", color: "#fff", opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? "Sending…" : "Request callback"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm"
            style={{ background: "#0071e3", color: "#fff" }}
          >
            <Phone className="w-4 h-4" />
            Talk to Sales
          </button>
        )}
      </div>

      {/* Mobile bar — fixed bottom (above bottom nav) */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {done ? (
          <div className="flex items-center gap-2 flex-1">
            <CheckCircle className="w-5 h-5" style={{ color: "#1cc77f" }} />
            <span className="text-caption" style={{ color: "#1d1d1f" }}>We&apos;ll call you back shortly!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required
              className="flex-1 min-w-0 px-3 py-2 rounded-standard text-sm outline-none"
              style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.06)", color: "#1d1d1f" }} />
            <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="flex-1 min-w-0 px-3 py-2 rounded-standard text-sm outline-none"
              style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.06)", color: "#1d1d1f" }} />
            <button type="submit" disabled={isPending}
              className="shrink-0 px-4 py-2 rounded-standard text-sm font-semibold"
              style={{ background: "#0071e3", color: "#fff", opacity: isPending ? 0.6 : 1 }}>
              {isPending ? "…" : "Call me"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
