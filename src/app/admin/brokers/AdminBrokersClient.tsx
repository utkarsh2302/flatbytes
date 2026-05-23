"use client";

import { useState, useTransition } from "react";
import { Check, X, ChevronDown, ChevronUp, Pencil, BadgeCheck, Plus, Minus } from "lucide-react";
import {
  approveBroker, rejectBroker, updateBrokerCommission,
  updateBrokerTier, assignBrokerProject, unassignBrokerProject,
} from "./actions";

interface PendingBroker {
  id: string; name: string; phone: string; email: string | null;
  rera_id: string | null; created_at: string;
}

interface ActiveBroker {
  id: string; name: string; phone: string; email: string | null;
  rera_id: string | null; commission_pct: number; tier: string;
  bookings_count: number; gross_value: number; commission: number;
  assigned_projects: { id: string; name: string }[];
}

interface Project { id: string; name: string; }

interface Props {
  pending: PendingBroker[];
  active: ActiveBroker[];
  allProjects: Project[];
}

function inrShort(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function PendingCard({ broker }: { broker: PendingBroker }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  if (done === "approved") return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(28,199,127,0.08)", border: "1px solid rgba(28,199,127,0.2)" }}>
      <Check className="w-4 h-4" style={{ color: "#1cc77f" }} />
      <span style={{ fontSize: "0.85rem", color: "#1a7f4a", fontWeight: 600 }}>{broker.name} approved</span>
    </div>
  );
  if (done === "rejected") return null;

  return (
    <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{broker.name}</div>
        <div style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
          {broker.phone}{broker.email ? ` · ${broker.email}` : ""}
          {broker.rera_id ? ` · RERA: ${broker.rera_id}` : " · No RERA"}
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.35)", marginTop: 2 }}>
          Applied {new Date(broker.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button disabled={pending}
          onClick={() => start(async () => { const r = await approveBroker(broker.id); if (r.ok) setDone("approved"); })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: pending ? "#f0f0f2" : "rgba(28,199,127,0.1)", color: "#1cc77f", border: "none", cursor: pending ? "not-allowed" : "pointer" }}>
          <Check className="w-3.5 h-3.5" /> Approve
        </button>
        <button disabled={pending}
          onClick={() => start(async () => { const r = await rejectBroker(broker.id); if (r.ok) setDone("rejected"); })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: pending ? "#f0f0f2" : "rgba(239,68,68,0.08)", color: "#ef4444", border: "none", cursor: pending ? "not-allowed" : "pointer" }}>
          <X className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

function CommissionEditor({ broker }: { broker: ActiveBroker }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(broker.commission_pct);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => start(async () => {
    const r = await updateBrokerCommission(broker.id, value);
    if (r.ok) { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2000); }
  });

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
      style={{ background: saved ? "rgba(28,199,127,0.1)" : "rgba(245,158,11,0.1)", color: saved ? "#1cc77f" : "#b45309", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
      {saved ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
      {value}%
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      <input type="number" min={0} max={10} step={0.25} value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: 56, padding: "2px 6px", borderRadius: 8, border: "1.5px solid #0071e3", fontSize: "0.8rem", fontWeight: 700, outline: "none", color: "#1d1d1f", textAlign: "center" }} />
      <button onClick={save} disabled={pending}
        style={{ padding: "3px 8px", borderRadius: 8, background: "#0071e3", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
        Save
      </button>
      <button onClick={() => setEditing(false)}
        style={{ padding: "3px 6px", borderRadius: 8, background: "#f0f0f2", color: "#1d1d1f", border: "none", cursor: "pointer", fontSize: "0.75rem" }}>
        ✕
      </button>
    </div>
  );
}

function ProjectAssigner({ broker, allProjects }: { broker: ActiveBroker; allProjects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const assignedIds = new Set(broker.assigned_projects.map((p) => p.id));
  const unassigned = allProjects.filter((p) => !assignedIds.has(p.id));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {broker.assigned_projects.map((p) => (
          <span key={p.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3", fontSize: "0.72rem", fontWeight: 600 }}>
            {p.name}
            <button onClick={() => start(async () => { await unassignBrokerProject(broker.id, p.id); })}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "rgba(0,113,227,0.6)", display: "flex" }}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {unassigned.length > 0 && (
          <button onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.5)", fontSize: "0.72rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus className="w-3 h-3" /> Assign Project
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ background: "#f5f5f7", maxHeight: 180, overflowY: "auto" }}>
          {unassigned.map((p) => (
            <button key={p.id} disabled={pending}
              onClick={() => start(async () => { await assignBrokerProject(broker.id, p.id); setOpen(false); })}
              className="w-full text-left px-3 py-2 flex items-center gap-2"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#1d1d1f" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,113,227,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
              <Plus className="w-3.5 h-3.5" style={{ color: "#0071e3", flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveBrokerCard({ broker, allProjects, rank }: { broker: ActiveBroker; allProjects: Project[]; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();
  const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];
  const isPremium = broker.tier === "premium";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Main row */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{ background: rank < 3 ? RANK_COLORS[rank] : "#f0f0f2", color: rank < 3 ? "#fff" : "rgba(0,0,0,0.4)" }}>
          {rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{broker.name}</span>
            {isPremium && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#7c3aed", background: "rgba(124,58,237,0.1)" }}><BadgeCheck className="w-3 h-3" />Premium</span>}
          </div>
          <div style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
            {broker.phone}{broker.email ? ` · ${broker.email}` : ""}
            {broker.rera_id ? ` · RERA: ${broker.rera_id}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f59e0b" }}>{inrShort(broker.commission)}</div>
            <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)" }}>{broker.bookings_count} bookings</div>
          </div>
          <button onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#f5f5f7", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.5)" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded management panel */}
      {expanded && (
        <div className="px-4 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {/* Stats */}
            {[
              { label: "Gross Sales", value: inrShort(broker.gross_value) },
              { label: "Commission Earned", value: inrShort(broker.commission), accent: "#f59e0b" },
              { label: "Bookings", value: String(broker.bookings_count) },
            ].map((st) => (
              <div key={st.label} className="rounded-xl p-3" style={{ background: "#f9f9fa" }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: st.accent ?? "#1d1d1f" }}>{st.value}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Commission config */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Commission Rate</div>
              <CommissionEditor broker={broker} />
            </div>

            {/* Tier management */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tier</div>
              <div className="flex gap-2">
                {(["free", "premium"] as const).map((t) => (
                  <button key={t} disabled={pending || broker.tier === t}
                    onClick={() => start(async () => { await updateBrokerTier(broker.id, t); })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize"
                    style={{
                      background: broker.tier === t ? (t === "premium" ? "rgba(124,58,237,0.12)" : "#f0f0f2") : "#f9f9fa",
                      color: broker.tier === t ? (t === "premium" ? "#7c3aed" : "#1d1d1f") : "rgba(0,0,0,0.45)",
                      border: broker.tier === t ? `1.5px solid ${t === "premium" ? "rgba(124,58,237,0.3)" : "rgba(0,0,0,0.1)"}` : "1.5px solid transparent",
                      cursor: broker.tier === t ? "default" : "pointer",
                    }}>
                    {t === "premium" && <BadgeCheck className="w-3.5 h-3.5" />}
                    {t === "premium" ? "Premium Partner" : "Standard"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project assignment */}
          <div className="mt-4">
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Assigned Projects</div>
            <ProjectAssigner broker={broker} allProjects={allProjects} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBrokersClient({ pending, active, allProjects }: Props) {
  return (
    <div>
      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Pending Approval</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}>
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((b) => <PendingCard key={b.id} broker={b} />)}
          </div>
        </div>
      )}

      {/* Active brokers */}
      <div>
        <h2 className="mb-3" style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>
          Active Partners ({active.length})
        </h2>
        <div className="space-y-3">
          {active.map((b, i) => (
            <ActiveBrokerCard key={b.id} broker={b} allProjects={allProjects} rank={i} />
          ))}
          {active.length === 0 && (
            <div className="rounded-2xl py-14 text-center" style={{ background: "#fff", color: "rgba(0,0,0,0.35)" }}>
              <p style={{ fontSize: "0.9rem" }}>No active brokers yet. Approve pending requests above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
