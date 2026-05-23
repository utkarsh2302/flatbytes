"use client";

import { Phone, TrendingUp, Sparkles, Flame, Clock, ChevronRight } from "lucide-react";

interface ScoredLead { id: string; name: string; phone: string; project_name: string; status: string; source: string; score: number; budget_min: number | null; preferred_bhk: string[] | null; }
interface FollowUpLead { id: string; name: string; phone: string; project_name: string; days_since: number; status: string; }
interface FunnelStage { label: string; count: number; color: string; }
interface MonthlyBooking { month: string; count: number; value: number; }

interface Props {
  hotLeads: ScoredLead[];
  warmLeads: ScoredLead[];
  followUpDue: FollowUpLead[];
  funnelStages: FunnelStage[];
  monthlyBookings: MonthlyBooking[];
  avgScore: number;
  projectedBookings: number;
  totalLeads: number;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#3b82f6";
  const label = score >= 70 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const bg = score >= 70 ? "rgba(239,68,68,0.1)" : score >= 50 ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)";
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score * 0.817} 82`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "0.58rem", fontWeight: 800, color }}>{score}</span>
      </div>
      <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: "0.65rem", fontWeight: 700, background: bg, color }}>{label}</span>
    </div>
  );
}

function inrShort(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AIInsightsClient({ hotLeads, warmLeads, followUpDue, funnelStages, monthlyBookings, avgScore, projectedBookings, totalLeads }: Props) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const maxCount = Math.max(1, ...monthlyBookings.map((m) => m.count));

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      {/* AI Daily Summary */}
      <div className="rounded-2xl p-5 mb-6 overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1d1d1f 0%, #3d3d40 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #0071e3 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Daily Summary · {today}</span>
          </div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Good morning! Here&apos;s what needs your attention today.</h2>
          <ul className="space-y-1.5">
            {[
              hotLeads.length > 0 && `🔥 ${hotLeads.length} hot leads (score 70+) ready to convert — call them first`,
              followUpDue.length > 0 && `📞 ${followUpDue.length} leads haven't been contacted in 3+ days`,
              `📈 Pipeline health score: ${avgScore}/100 — ${avgScore >= 60 ? "strong pipeline" : "nurture more leads"}`,
              projectedBookings > 0 && `🎯 Based on current pipeline, ${projectedBookings} bookings projected this month`,
            ].filter(Boolean).map((item, i) => (
              <li key={i} style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", display: "flex", gap: 6 }}>{item as string}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Leads", value: String(totalLeads), color: "#0071e3" },
          { label: "Hot Leads", value: String(hotLeads.length), color: "#ef4444", sub: "Score 70+" },
          { label: "Avg Pipeline Score", value: `${avgScore}`, color: "#f59e0b", sub: "Out of 100" },
          { label: "Projected Bookings", value: String(projectedBookings), color: "#1cc77f", sub: "This month" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{k.label}</div>
            {k.sub && <div style={{ fontSize: "0.66rem", color: "rgba(0,0,0,0.3)", marginTop: 1 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Conversion Funnel */}
        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#0071e3" }} />
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Conversion Funnel</h3>
          </div>
          <div className="space-y-2.5">
            {funnelStages.map((s, i) => {
              const pct = funnelStages[0].count > 0 ? Math.round((s.count / funnelStages[0].count) * 100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between mb-1" style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "rgba(0,0,0,0.6)", fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.count} <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 999, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          {funnelStages[0].count > 0 && funnelStages[funnelStages.length - 1].count > 0 && (
            <div className="mt-4 pt-3 flex justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", fontSize: "0.75rem", color: "rgba(0,0,0,0.45)" }}>
              <span>Overall conversion</span>
              <span style={{ fontWeight: 700, color: "#1cc77f" }}>
                {Math.round((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Monthly booking trend */}
        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Booking Trend</h3>
          </div>
          <div className="flex items-end gap-2 h-36">
            {monthlyBookings.map((m) => {
              const h = maxCount > 0 ? Math.max(8, (m.count / maxCount) * 100) : 8;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: m.count > 0 ? "#1d1d1f" : "rgba(0,0,0,0.2)" }}>{m.count || ""}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, background: m.count > 0 ? "linear-gradient(to top, #0071e3, #60a5fa)" : "rgba(0,0,0,0.05)" }} />
                  <span style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hot Leads */}
      {hotLeads.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Hot Leads — Call Today</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{hotLeads.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            {hotLeads.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <ScoreBadge score={l.score} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{l.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                    {l.project_name} · {l.source}
                    {l.budget_min ? ` · Budget ${inrShort(l.budget_min)}+` : ""}
                    {l.preferred_bhk?.length ? ` · ${l.preferred_bhk.join("/")}` : ""}
                  </div>
                </div>
                <a href={`tel:${l.phone}`} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3" }}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Due */}
      {followUpDue.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Follow-up Due</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#b45309" }}>{followUpDue.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            {followUpDue.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: l.days_since >= 7 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: l.days_since >= 7 ? "#ef4444" : "#b45309" }}>{l.days_since}d</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{l.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                    {l.project_name} · Last contacted {l.days_since} days ago
                  </div>
                </div>
                <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${l.name}, just checking in on your interest in ${l.project_name}. Is there anything we can help you with?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e" }}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warm leads */}
      {warmLeads.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Warm Leads — Nurture</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#b45309" }}>{warmLeads.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            {warmLeads.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <ScoreBadge score={l.score} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{l.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                    {l.project_name} · {l.source}
                    {l.budget_min ? ` · ${inrShort(l.budget_min)}+` : ""}
                  </div>
                </div>
                <a href={`tel:${l.phone}`} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.5)" }}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
