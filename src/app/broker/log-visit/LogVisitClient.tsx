"use client";

import { useMemo, useState, useTransition } from "react";
import { Camera, MapPin, Phone, User, ChevronRight, Clock } from "lucide-react";
import { logVisit } from "./actions";

interface Project { id: string; name: string; location: string }
interface FlatOpt { id: string; projectId: string; label: string }
interface RecentVisit { id: string; name: string; phone: string; note: string; projectName: string; at: string }

export default function LogVisitClient({ projects, flats, recent }: { projects: Project[]; flats: FlatOpt[]; recent: RecentVisit[] }) {
  const [clientName, setClientName]   = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [projectId, setProjectId]     = useState("");
  const [flatId, setFlatId]           = useState("");
  const [notes, setNotes]             = useState("");

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const flatsForProject = useMemo(() => flats.filter((f) => f.projectId === projectId), [flats, projectId]);
  const canSubmit = clientName.trim() && clientPhone.trim() && projectId && !pending;

  function submit() {
    setResult(null);
    startTransition(async () => {
      const r = await logVisit({ clientName, clientPhone, projectId, flatId: flatId || undefined, notes });
      setResult(r);
      if (r.ok) { setClientName(""); setClientPhone(""); setFlatId(""); setNotes(""); }
    });
  }

  function fmtDate(s: string) {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } catch { return ""; }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
          <Camera className="w-5 h-5" style={{ color: "#8b5cf6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f" }}>Log a Site Visit</h1>
          <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>Record a client you took to a project — it becomes a lead you can follow up</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-3" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Client phone" inputMode="tel"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
            </div>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setFlatId(""); }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }}>
              <option value="">Which project did they visit?</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.location ? ` — ${p.location}` : ""}</option>)}
            </select>
          </div>

          {projectId && (
            <select value={flatId} onChange={(e) => setFlatId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }}>
              <option value="">Flat shown (optional)</option>
              {flatsForProject.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          )}

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="How did it go? Client's interest level, budget, next step…"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />

          {result && (
            <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: result.ok ? "rgba(28,199,127,0.1)" : "rgba(239,68,68,0.08)", color: result.ok ? "#1a7f4a" : "#b91c1c" }}>
              {result.ok ? "✅ Visit logged — added to your Lead Inbox." : result.error}
            </div>
          )}

          <button onClick={submit} disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: canSubmit ? "#8b5cf6" : "#c7c7cc", color: "#fff", border: "none", cursor: canSubmit ? "pointer" : "not-allowed" }}>
            {pending ? "Saving…" : <>Log Visit <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Recent visits */}
        <div className="rounded-2xl p-5 h-fit" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Recent Visits</h2>
          {recent.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "rgba(0,0,0,0.35)", fontSize: "0.82rem" }}>
              <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(0,0,0,0.18)" }} />
              No visits logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((v) => (
                <div key={v.id} className="p-3 rounded-xl" style={{ background: "#f7f7f8" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d1d1f" }}>{v.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.4)" }}>{fmtDate(v.at)}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>{v.projectName}</div>
                  {v.note && <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.4)", marginTop: 4, fontStyle: "italic" }}>“{v.note}”</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
