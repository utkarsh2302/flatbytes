"use client";

import { useState, useTransition } from "react";
import { lookupCustomer } from "./actions";
import type { CustomerData } from "@/lib/saas";
import { inrShort, inrFull, dateShort, relativeDays } from "@/lib/format";
import {
  Search, Phone, Building2, Home, CheckCircle2, Clock, AlertTriangle,
  Receipt, Download, HardHat, MessageSquareWarning, ArrowLeft,
} from "lucide-react";

const DEMO_PHONES = ["9811100001", "9811100005", "9811100010"];

export default function PortalLookup() {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search(p: string) {
    setError(null);
    startTransition(async () => {
      const res = await lookupCustomer(p);
      if (res.ok && res.data) { setData(res.data); }
      else { setError(res.error ?? "Lookup failed"); setData(null); }
    });
  }

  if (data) return <CustomerDashboard data={data} onBack={() => { setData(null); setPhone(""); }} />;

  return (
    <div className="rounded-2xl p-7" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 8px 28px rgba(0,0,0,0.05)" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); search(phone); }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your registered phone number"
            inputMode="numeric"
            className="w-full pl-10 pr-3 py-3 rounded-xl outline-none text-sm"
            style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.07)" }}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "#0071e3", color: "#fff", opacity: pending ? 0.6 : 1 }}
        >
          <Search className="w-4 h-4" />
          {pending ? "Searching…" : "Find My Booking"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>{error}</p>
      )}

      <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: "0.76rem", color: "rgba(0,0,0,0.42)", marginBottom: 8 }}>Try a demo number:</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_PHONES.map((p) => (
            <button
              key={p}
              onClick={() => { setPhone(p); search(p); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#f0f0f2", color: "#0071e3" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerDashboard({ data, onBack }: { data: CustomerData; onBack: () => void }) {
  const { booking, schedule, receipts } = data;
  const pct = Math.round((booking.collected / (booking.agreement_value || 1)) * 100);
  const nextDue = schedule.find((s) => !s.is_paid);

  // Construction journey derived from construction-linked milestones
  const construction = schedule
    .filter((s) => /foundation|slab|plaster|possession|excavation|structure/i.test(s.milestone_label))
    .map((s) => ({ label: s.milestone_label, done: relativeDays(s.due_date) < 0 }));

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "rgba(0,0,0,0.5)" }}>
        <ArrowLeft className="w-4 h-4" /> Look up another booking
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0a2a4a,#0071e3)" }}>
        <div className="absolute" style={{ top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div className="relative">
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Welcome back</p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginTop: 2 }}>{booking.buyer_name}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            <span className="flex items-center gap-1.5" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>
              <Building2 className="w-3.5 h-3.5" /> {booking.project_name}
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>
              <Home className="w-3.5 h-3.5" /> Flat {booking.flat_number} · {booking.flat_type.toUpperCase()} · Floor {booking.floor}
            </span>
          </div>
        </div>
      </div>

      {/* Payment progress */}
      <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Payment Progress</h3>
          {nextDue && (
            <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#d97706", background: "rgba(245,158,11,0.12)" }}>
              Next: {nextDue.milestone_label} · {dateShort(nextDue.due_date)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Agreement Value", value: inrShort(booking.agreement_value), color: "#1d1d1f" },
            { label: "Paid", value: inrShort(booking.collected), color: "#059669" },
            { label: "Outstanding", value: inrShort(booking.pending), color: "#d97706" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: "#f7f7f8" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1cc77f,#059669)" }} />
        </div>
        <p className="text-center mt-1.5" style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.45)" }}>{pct}% of total paid</p>
      </div>

      {/* Schedule timeline */}
      <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Payment Schedule</h3>
        <div className="space-y-1">
          {schedule.map((s) => {
            const days = relativeDays(s.due_date);
            const overdue = !s.is_paid && days < 0;
            return (
              <div key={s.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: s.is_paid ? "rgba(16,185,129,0.12)" : overdue ? "rgba(239,68,68,0.12)" : "rgba(0,0,0,0.05)" }}
                >
                  {s.is_paid ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#059669" }} />
                    : overdue ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                    : <Clock className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.35)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1d1d1f" }}>{s.milestone_label}</div>
                  <div style={{ fontSize: "0.72rem", color: overdue ? "#ef4444" : "rgba(0,0,0,0.45)" }}>
                    {s.is_paid ? `Paid ${dateShort(s.paid_at)}` : overdue ? `Overdue by ${Math.abs(days)} days` : `Due ${dateShort(s.due_date)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1d1d1f" }}>{inrShort(s.amount)}</div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)" }}>{s.percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Construction journey */}
      {construction.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="w-4 h-4" style={{ color: "#d97706" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Construction Updates</h3>
          </div>
          <div className="flex items-center gap-1">
            {construction.map((c, i) => (
              <div key={c.label} className="flex-1 flex items-center">
                <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: c.done ? "#1cc77f" : "#f0f0f2" }}
                  >
                    {c.done
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "#fff" }} />
                      : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(0,0,0,0.35)" }}>{i + 1}</span>}
                  </div>
                  <span className="text-center mt-1.5" style={{ fontSize: "0.64rem", color: "rgba(0,0,0,0.5)", lineHeight: 1.2 }}>
                    {c.label.replace(/^On /, "")}
                  </span>
                </div>
                {i < construction.length - 1 && (
                  <div className="flex-1 h-0.5 mb-5" style={{ background: c.done ? "#1cc77f" : "#f0f0f2" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipts + complaint */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4" style={{ color: "#0071e3" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>Receipts ({receipts.length})</h3>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {receipts.length === 0 && <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.4)" }}>No receipts yet.</p>}
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#f7f7f8" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "#1d1d1f" }}>{r.receipt_number}</div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.42)" }}>{dateShort(r.payment_date)} · {inrFull(r.amount)}</div>
                </div>
                <button className="p-1.5 rounded-lg" style={{ background: "#fff" }}>
                  <Download className="w-3.5 h-3.5" style={{ color: "#0071e3" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareWarning className="w-4 h-4" style={{ color: "#a855f7" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>Need Help?</h3>
          </div>
          <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
            Raise a service request or complaint — our team responds within 48 hours.
          </p>
          <div className="space-y-2 mt-3">
            {["Raise a complaint", "Request a document", "Contact relationship manager"].map((a) => (
              <button
                key={a}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "#f7f7f8", color: "#1d1d1f" }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
