"use client";

import { useState } from "react";
import { TrendingUp, IndianRupee, Clock, AlertCircle, Building2, Award, ChevronRight } from "lucide-react";
import type { RevenueStats } from "./page";

function inr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  confirmed:   { color: "#1cc77f", bg: "rgba(28,199,127,0.1)",  label: "Confirmed" },
  pending:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending" },
  cancelled:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Cancelled" },
  registered:  { color: "#0071e3", bg: "rgba(0,113,227,0.1)",   label: "Registered" },
};

function BarChart({ data }: { data: { month: string; value: number; count: number }[] }) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-48" style={{ color: "rgba(0,0,0,0.3)", fontSize: "0.875rem" }}>
      No booking data yet
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-48 pt-4">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center mb-1"
              style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
              {inr(d.value)}<br/>
              <span style={{ color: "rgba(0,0,0,0.4)" }}>{d.count} unit{d.count !== 1 ? "s" : ""}</span>
            </div>
            {/* Bar */}
            <div className="w-full rounded-t-lg transition-all"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: i === data.length - 1
                  ? "linear-gradient(to top, #0071e3, #5aabff)"
                  : "linear-gradient(to top, rgba(0,113,227,0.25), rgba(0,113,227,0.5))",
                minHeight: 4,
              }}/>
            <span style={{ fontSize: "0.6rem", color: "rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{monthLabel(d.month)}</span>
          </div>
        );
      })}
    </div>
  );
}

function CollectionBar({ collected, total }: { collected: number; total: number }) {
  const pct = total > 0 ? (collected / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.5)" }}>
        <span>Collected {inr(collected)}</span>
        <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(to right, #1cc77f, #34d399)" }}/>
      </div>
      <div className="flex justify-between mt-1" style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.38)" }}>
        <span>Outstanding {inr(total - collected)}</span>
        <span>Total {inr(total)}</span>
      </div>
    </div>
  );
}

export default function RevenueCommandCentre({ stats }: { stats: RevenueStats }) {
  const [tab, setTab] = useState<"overview" | "bookings" | "projects">("overview");

  const kpis = [
    {
      label: "Total Booking Value",
      value: inr(stats.totalBookingValue),
      sub: `${stats.bookingsCount} active bookings`,
      icon: TrendingUp,
      color: "#0071e3",
      bg: "rgba(0,113,227,0.08)",
    },
    {
      label: "Collected",
      value: inr(stats.collected),
      sub: `${stats.totalBookingValue > 0 ? ((stats.collected / stats.totalBookingValue) * 100).toFixed(1) : 0}% of total`,
      icon: IndianRupee,
      color: "#1cc77f",
      bg: "rgba(28,199,127,0.08)",
    },
    {
      label: "Outstanding",
      value: inr(stats.outstanding),
      sub: `${stats.overdueCount} payments overdue`,
      icon: Clock,
      color: stats.overdueCount > 0 ? "#ef4444" : "#f59e0b",
      bg: stats.overdueCount > 0 ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
    },
    {
      label: "Avg Booking Value",
      value: inr(stats.avgBookingValue),
      sub: stats.cancelledValue > 0 ? `${inr(stats.cancelledValue)} cancelled` : "No cancellations",
      icon: Award,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.08)",
    },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
          Revenue Command Centre
        </h1>
        <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.48)", marginTop: 4 }}>
          Real-time view of bookings, collections, and revenue pipeline
        </p>
      </div>

      {/* Overdue alert */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#ef4444" }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1d1d1f" }}>
              {stats.overdueCount} overdue payments
            </span>
            <span style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.55)", marginLeft: 8 }}>
              {inr(stats.overdueAmount)} pending past due date
            </span>
          </div>
          <a href="/admin/payments" className="ml-auto flex items-center gap-1 text-sm font-semibold" style={{ color: "#ef4444", textDecoration: "none" }}>
            View <ChevronRight className="w-4 h-4"/>
          </a>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: kpi.bg }}>
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(0,0,0,0.48)", marginTop: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.35)", marginTop: 2 }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Collection progress bar */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f", marginBottom: 12 }}>
          Collection Progress
        </div>
        <CollectionBar collected={stats.collected} total={stats.totalBookingValue} />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: "#f0f0f2" }}>
        {(["overview", "bookings", "projects"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={tab === t
              ? { background: "#fff", color: "#1d1d1f", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
              : { background: "transparent", color: "rgba(0,0,0,0.48)" }}>
            {t === "overview" ? "Monthly Trend" : t === "bookings" ? "Recent Bookings" : "By Project"}
          </button>
        ))}
      </div>

      {/* Monthly trend chart */}
      {tab === "overview" && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f", marginBottom: 4 }}>Booking Value by Month</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", marginBottom: 16 }}>Last 8 months · hover for details</div>
          <BarChart data={stats.byMonth} />
        </div>
      )}

      {/* Recent bookings table */}
      {tab === "bookings" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>Recent Bookings</span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {stats.recentBookings.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "rgba(0,0,0,0.35)", fontSize: "0.9rem" }}>No bookings yet</div>
            ) : stats.recentBookings.map(b => {
              const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
              const collPct = b.agreement_value > 0 ? Math.round((b.collected / b.agreement_value) * 100) : 0;
              return (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="shrink-0">
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1d1d1f" }}>{b.buyer_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                      {b.project_name} · Flat {b.flat_number} · {fmt(b.booked_at)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${collPct}%`, background: "#1cc77f" }}/>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.38)", marginTop: 3 }}>{collPct}% collected</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{inr(b.agreement_value)}</div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By project breakdown */}
      {tab === "projects" && (
        <div className="space-y-3">
          {stats.byProject.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: "#fff", color: "rgba(0,0,0,0.35)", fontSize: "0.9rem" }}>No data</div>
          ) : stats.byProject.map(p => {
            const collPct = p.value > 0 ? Math.round((p.collected / p.value) * 100) : 0;
            return (
              <div key={p.name} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,113,227,0.08)" }}>
                      <Building2 className="w-4 h-4" style={{ color: "#0071e3" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{p.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)" }}>{p.count} bookings</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1d1d1f" }}>{inr(p.value)}</div>
                    <div style={{ fontSize: "0.72rem", color: "#1cc77f", fontWeight: 600 }}>{inr(p.collected)} collected</div>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${collPct}%`, background: "linear-gradient(to right, #0071e3, #5aabff)" }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
