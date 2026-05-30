"use client";

import { useState, useTransition } from "react";
import { Phone, MessageCircle, Award, TrendingUp, ChevronDown, ChevronUp, Check, Pencil, Send, Loader2, Clock } from "lucide-react";
import { inrShort } from "@/lib/format";
import type { BrokerLead, BrokerActivity } from "@/lib/broker";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:             { label: "New",          color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  contacted:       { label: "Contacted",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  visit_scheduled: { label: "Visit Booked", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  negotiating:     { label: "Negotiating",  color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  won:             { label: "Won",          color: "#1cc77f", bg: "rgba(28,199,127,0.1)" },
  lost:            { label: "Lost",         color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: "📞",
  whatsapp: "💬",
  site_visit: "🏢",
  note: "📝",
  stage_change: "🔄",
};

const STAGES = ["new", "contacted", "visit_scheduled", "negotiating", "won", "lost"];

interface Props {
  leads: BrokerLead[];
  activitiesByLead: Record<string, BrokerActivity[]>;
  stats: { totalCommission: number; wonCount: number; activeCount: number; pendingCount: number };
  brokerId: string;
  orgId: string;
}

function StageDropdown({
  current,
  assignmentId,
  leadId,
  onUpdated,
}: {
  current: string;
  assignmentId: string;
  leadId: string;
  onUpdated: (stage: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const s = STATUS_CONFIG[current] ?? STATUS_CONFIG.new;

  const moveTo = (stage: string) => {
    setOpen(false);
    start(async () => {
      const r = await fetch("/api/broker/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, leadId, stage }),
      });
      if (r.ok) onUpdated(stage);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: s.bg, color: s.color, border: "none", cursor: "pointer" }}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {s.label}
        <ChevronDown className="w-3 h-3" style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", minWidth: 160 }}>
            {STAGES.map((stage) => {
              const cfg = STATUS_CONFIG[stage];
              return (
                <button key={stage} onClick={() => moveTo(stage)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm"
                  style={{
                    background: stage === current ? `${cfg.bg}` : "none",
                    color: stage === current ? cfg.color : "#1d1d1f",
                    fontWeight: stage === current ? 700 : 400,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (stage !== current) e.currentTarget.style.background = "#f5f5f7"; }}
                  onMouseLeave={(e) => { if (stage !== current) e.currentTarget.style.background = "none"; }}>
                  {stage === current && <Check className="w-3 h-3" />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ActivityLogForm({
  leadId,
  onAdded,
}: {
  leadId: string;
  onAdded: (activity: BrokerActivity) => void;
}) {
  const [type, setType] = useState<string>("call");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!note.trim()) return;
    start(async () => {
      const r = await fetch("/api/broker/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type, note }),
      });
      if (r.ok) {
        const { activity } = await r.json();
        onAdded(activity);
        setNote("");
      }
    });
  };

  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: "#f9f9fa", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex gap-1.5 mb-2">
        {(["call", "whatsapp", "site_visit", "note"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{
              background: type === t ? "#0071e3" : "#fff",
              color: type === t ? "#fff" : "rgba(0,0,0,0.55)",
              border: `1px solid ${type === t ? "#0071e3" : "rgba(0,0,0,0.1)"}`,
              cursor: "pointer",
            }}>
            {ACTIVITY_ICONS[t]} {t.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Add a note..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }}
        />
        <button onClick={submit} disabled={pending || !note.trim()}
          className="px-3 py-2 rounded-xl flex items-center justify-center"
          style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer", opacity: !note.trim() ? 0.4 : 1 }}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function AIFollowupButton({
  leadName,
  projectName,
  stage,
  lastNote,
}: {
  leadName: string;
  projectName: string;
  stage: string;
  lastNote?: string;
}) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    const r = await fetch("/api/broker/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadName, projectName, stage, lastNote }),
    });
    if (r.ok) {
      const { message } = await r.json();
      setMsg(message);
    }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2">
      {!msg ? (
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(139,92,246,0.1)", color: "#7c3aed", border: "none", cursor: "pointer" }}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨"}
          AI Follow-up Draft
        </button>
      ) : (
        <div className="rounded-xl p-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="text-sm mb-2" style={{ color: "#1d1d1f", lineHeight: 1.5 }}>{msg}</div>
          <div className="flex gap-2">
            <button onClick={copy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: copied ? "rgba(28,199,127,0.1)" : "rgba(139,92,246,0.1)", color: copied ? "#1cc77f" : "#7c3aed", border: "none", cursor: "pointer" }}>
              {copied ? <Check className="w-3 h-3" /> : null}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => setMsg("")} className="text-xs" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.35)" }}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  initialActivities,
}: {
  lead: BrokerLead;
  initialActivities: BrokerActivity[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState(lead.status);
  const [activities, setActivities] = useState<BrokerActivity[]>(initialActivities);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const s = STATUS_CONFIG[stage] ?? STATUS_CONFIG.new;

  const maskedPhone = lead.phone.replace(/(\d{2})(\d+)(\d{2})/, (_, a, m, b) => `${a}${"•".repeat(m.length)}${b}`);
  const waLink = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.name}, `)}`;

  const lastNote = activities[0]?.note;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold"
          style={{ background: "#f5f5f7", color: "#1d1d1f", fontSize: "0.875rem" }}>
          {lead.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1d1d1f" }}>{lead.name}</div>
          <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
            {lead.project_name}
            {lead.flat_number ? ` · Flat ${lead.flat_number}` : ""}
            {" · "}{new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lead.commission_earned ? (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(28,199,127,0.1)", color: "#1a7f4a" }}>
              <Award className="w-3 h-3" /> {inrShort(lead.commission_earned)}
            </span>
          ) : null}

          {/* Stage badge with dropdown */}
          <StageDropdown
            current={stage}
            assignmentId={lead.assignmentId}
            leadId={lead.id}
            onUpdated={setStage}
          />

          {/* WhatsApp */}
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e" }}>
            <MessageCircle className="w-3.5 h-3.5" />
          </a>

          {/* Phone */}
          <button onClick={() => setPhoneRevealed((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3", border: "none", cursor: "pointer" }}>
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Expand */}
          <button onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#f5f5f7", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Phone reveal bar */}
      {phoneRevealed && (
        <div className="px-5 py-2 flex items-center gap-2" style={{ background: "rgba(0,113,227,0.05)", borderTop: "1px solid rgba(0,113,227,0.08)" }}>
          <Phone className="w-3.5 h-3.5" style={{ color: "#0071e3" }} />
          <a href={`tel:${lead.phone}`} style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0071e3", textDecoration: "none" }}>
            {lead.phone}
          </a>
        </div>
      )}

      {/* Expanded: activity timeline + log form */}
      {expanded && (
        <div className="px-5 pb-5 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          {/* AI follow-up */}
          <AIFollowupButton
            leadName={lead.name}
            projectName={lead.project_name}
            stage={stage}
            lastNote={lastNote}
          />

          {/* Log activity form */}
          <ActivityLogForm
            leadId={lead.id}
            onAdded={(a) => setActivities((prev) => [a, ...prev])}
          />

          {/* Activity timeline */}
          {activities.length > 0 && (
            <div className="mt-4 space-y-2">
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Activity ({activities.length})
              </div>
              {activities.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-3 items-start">
                  <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#f5f5f7", fontSize: "0.75rem" }}>
                    {ACTIVITY_ICONS[a.type] ?? "•"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "0.8rem", color: "#1d1d1f" }}>{a.note}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.35)", marginTop: 1 }}>
                      {new Date(a.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activities.length === 0 && (
            <div className="mt-4 py-6 text-center" style={{ color: "rgba(0,0,0,0.3)", fontSize: "0.8rem" }}>
              No activity yet. Log a call or note above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrokerLeadsClient({ leads, activitiesByLead, stats, brokerId, orgId }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const pipeline = [
    { label: "Active", value: stats.activeCount, color: "#0071e3" },
    { label: "Won", value: stats.wonCount, color: "#1cc77f" },
    { label: "Need Follow-up", value: stats.pendingCount, color: "#f59e0b" },
    { label: "Commission", value: inrShort(stats.totalCommission), color: "#a855f7" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>My Leads</h1>
        <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.48)", marginTop: 3 }}>
          Tap a lead to log calls, send WhatsApp, or update stage.
        </p>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {pipeline.map((p) => (
          <div key={p.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: p.color }}>{p.value}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Stage filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {["all", ...STAGES].map((s) => {
          const cfg = STATUS_CONFIG[s];
          const isActive = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: isActive ? (cfg?.bg ?? "rgba(0,113,227,0.1)") : "#f5f5f7",
                color: isActive ? (cfg?.color ?? "#0071e3") : "rgba(0,0,0,0.5)",
                border: "none",
                cursor: "pointer",
              }}>
              {cfg?.label ?? "All"}
              {s !== "all" && (
                <span className="ml-1" style={{ opacity: 0.7 }}>
                  ({leads.filter((l) => l.status === s).length})
                </span>
              )}
              {s === "all" && ` (${leads.length})`}
            </button>
          );
        })}
      </div>

      {/* Lead cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#fff" }}>
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.4)" }}>
            {filter === "all" ? "No leads yet. Share your referral link to get started." : `No ${STATUS_CONFIG[filter]?.label ?? filter} leads.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              initialActivities={activitiesByLead[lead.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
