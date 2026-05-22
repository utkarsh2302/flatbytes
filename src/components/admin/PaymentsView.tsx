"use client";

import { useState, useMemo, useTransition } from "react";
import type { ScheduleRow } from "@/lib/saas";
import { inrShort, inrFull, dateShort, relativeDays } from "@/lib/format";
import { recordPayment } from "@/app/admin/payments/actions";
import { AlertTriangle, Clock, CheckCircle2, IndianRupee, Bell, Receipt } from "lucide-react";

type Tab = "overdue" | "upcoming" | "paid" | "all";

export default function PaymentsView({ schedule }: { schedule: ScheduleRow[] }) {
  const [tab, setTab] = useState<Tab>("overdue");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const now = Date.now();
  const enriched = useMemo(
    () =>
      schedule.map((s) => {
        const days = relativeDays(s.due_date);
        const overdue = !s.is_paid && days < 0;
        const dueSoon = !s.is_paid && days >= 0 && days <= 30;
        return { ...s, days, overdue, dueSoon };
      }),
    [schedule]
  );

  const collected = enriched.filter((s) => s.is_paid).reduce((a, s) => a + s.amount, 0);
  const pendingAmt = enriched.filter((s) => !s.is_paid).reduce((a, s) => a + s.amount, 0);
  const overdueAmt = enriched.filter((s) => s.overdue).reduce((a, s) => a + s.amount, 0);
  const dueSoonAmt = enriched.filter((s) => s.dueSoon).reduce((a, s) => a + s.amount, 0);

  const filtered = useMemo(() => {
    if (tab === "overdue") return enriched.filter((s) => s.overdue);
    if (tab === "upcoming") return enriched.filter((s) => s.dueSoon);
    if (tab === "paid") return enriched.filter((s) => s.is_paid).sort((a, b) => +new Date(b.paid_at!) - +new Date(a.paid_at!));
    return enriched;
  }, [enriched, tab]);

  const summary = [
    { label: "Collected", value: inrShort(collected), icon: CheckCircle2, accent: "#059669" },
    { label: "Pending", value: inrShort(pendingAmt), icon: Clock, accent: "#0071e3" },
    { label: "Overdue", value: inrShort(overdueAmt), icon: AlertTriangle, accent: "#ef4444" },
    { label: "Due in 30 days", value: inrShort(dueSoonAmt), icon: Bell, accent: "#d97706" },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "overdue", label: "Overdue", count: enriched.filter((s) => s.overdue).length },
    { id: "upcoming", label: "Due Soon", count: enriched.filter((s) => s.dueSoon).length },
    { id: "paid", label: "Paid", count: enriched.filter((s) => s.is_paid).length },
    { id: "all", label: "All", count: enriched.length },
  ];

  function handleRecord(id: string) {
    const fd = new FormData();
    fd.set("scheduleId", id);
    fd.set("mode", "bank_transfer");
    startTransition(async () => {
      const res = await recordPayment(fd);
      setToast(res.ok ? "Payment recorded · receipt generated" : `Error: ${res.error}`);
      setTimeout(() => setToast(null), 3000);
    });
  }

  function handleRemind(name: string) {
    setToast(`WhatsApp reminder queued for ${name}`);
    setTimeout(() => setToast(null), 2800);
  }

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Payments</h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Construction-linked installment tracking, due reminders, and receipts.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.accent}14` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: s.accent, width: 18, height: 18 }} />
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1d1d1f" }}>{s.value}</div>
              <div style={{ fontSize: "0.76rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* GST note */}
      <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl" style={{ background: "rgba(0,113,227,0.06)" }}>
        <IndianRupee className="w-3.5 h-3.5" style={{ color: "#0071e3" }} />
        <span style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.6)" }}>
          All amounts are inclusive of applicable GST (5% on under-construction units).
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
            style={
              tab === t.id
                ? { background: "#1d1d1f", color: "#fff" }
                : { background: "#fff", color: "rgba(0,0,0,0.55)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
            }
          >
            {t.label}
            <span
              className="px-1.5 rounded-full"
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                background: tab === t.id ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ background: "#f7f7f8" }}>
                {["Buyer", "Flat", "Milestone", "Due Date", "Amount", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td className="px-4 py-3">
                    <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1d1d1f" }}>{s.buyer_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.42)" }}>{s.project_name}</div>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f" }}>{s.flat_number}</td>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.7)" }}>{s.milestone_label}</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.4)" }}> · {s.percentage}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.65)" }}>{dateShort(s.due_date)}</div>
                    {!s.is_paid && (
                      <div style={{ fontSize: "0.7rem", color: s.overdue ? "#ef4444" : "rgba(0,0,0,0.4)" }}>
                        {s.overdue ? `${Math.abs(s.days)}d overdue` : `in ${s.days}d`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d1d1f" }}>{inrShort(s.amount)}</td>
                  <td className="px-4 py-3">
                    {s.is_paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 600, color: "#059669", background: "rgba(16,185,129,0.12)" }}>
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    ) : s.overdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.12)" }}>
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 600, color: "#d97706", background: "rgba(245,158,11,0.12)" }}>
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!s.is_paid && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRecord(s.id)}
                          disabled={pending}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: "#0071e3", color: "#fff", opacity: pending ? 0.6 : 1 }}
                        >
                          Record
                        </button>
                        <button
                          onClick={() => handleRemind(s.buyer_name)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#f0f0f2", color: "rgba(0,0,0,0.6)" }}
                        >
                          Remind
                        </button>
                      </div>
                    )}
                    {s.is_paid && (
                      <span className="inline-flex items-center gap-1" style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.4)" }}>
                        <Receipt className="w-3 h-3" /> {s.payment_mode?.replace(/_/g, " ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "rgba(0,0,0,0.35)" }}>
            <CheckCircle2 className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "0.9rem" }}>Nothing here — all clear in this view</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl"
          style={{ background: "#1d1d1f", color: "#fff", fontSize: "0.82rem", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
