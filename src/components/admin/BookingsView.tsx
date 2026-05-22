"use client";

import { useState, useMemo } from "react";
import type { BookingRow } from "@/lib/saas";
import { inrShort, inrFull, dateShort } from "@/lib/format";
import { Search, X, FileText, Phone, Mail, Building2, User, Calendar, IndianRupee, CheckCircle2 } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "#0071e3", bg: "rgba(0,113,227,0.1)" },
  agreement_signed: { label: "Agreement Signed", color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  registered: { label: "Registered", color: "#059669", bg: "rgba(16,185,129,0.12)" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function BookingsView({ bookings }: { bookings: BookingRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<BookingRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchQuery =
        !q ||
        b.buyer_name.toLowerCase().includes(q) ||
        b.buyer_phone.includes(q) ||
        b.flat_number.toLowerCase().includes(q) ||
        b.project_name.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [bookings, query, statusFilter]);

  const totalValue = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.agreement_value, 0);
  const totalCollected = bookings.reduce((s, b) => s + b.collected, 0);

  const summary = [
    { label: "Total Bookings", value: String(bookings.filter((b) => b.status !== "cancelled").length) },
    { label: "Sales Value", value: inrShort(totalValue) },
    { label: "Collected", value: inrShort(totalCollected) },
    { label: "Registered", value: String(bookings.filter((b) => b.status === "registered").length) },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Bookings</h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Every flat booking with allotment, agreement and collection status.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1d1d1f" }}>{s.value}</div>
            <div style={{ fontSize: "0.76rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.38)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyer, phone, flat…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)" }}
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "booked", "agreement_signed", "registered"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={
                statusFilter === s
                  ? { background: "#1d1d1f", color: "#fff" }
                  : { background: "#fff", color: "rgba(0,0,0,0.55)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
              }
            >
              {s === "all" ? "All" : STATUS_META[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#f7f7f8" }}>
                {["Buyer", "Flat", "Project", "Agreement Value", "Collected", "Status", "Booked"].map((h) => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const sm = STATUS_META[b.status] ?? STATUS_META.booked;
                const pct = Math.round((b.collected / (b.agreement_value || 1)) * 100);
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d1d1f" }}>{b.buyer_name}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.42)" }}>{b.buyer_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f" }}>{b.flat_number}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.42)" }}>{b.flat_type.toUpperCase()} · Fl {b.floor}</div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.65)" }}>{b.project_name}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d1d1f" }}>{inrShort(b.agreement_value)}</td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#059669" }}>{inrShort(b.collected)}</div>
                      <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "rgba(0,0,0,0.07)", width: 60 }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#1cc77f" }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 600, color: sm.color, background: sm.bg }}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)" }}>{dateShort(b.booked_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "rgba(0,0,0,0.35)" }}>
            <FileText className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "0.9rem" }}>No bookings match your filters</p>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={() => setSelected(null)} />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] overflow-y-auto"
            style={{ background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Booking Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg" style={{ background: "#f0f0f2" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Buyer card */}
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#0071e3,#00a8e8)" }}>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{selected.buyer_name}</div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="flex items-center gap-1.5" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>
                    <Phone className="w-3 h-3" /> {selected.buyer_phone}
                  </span>
                  {selected.buyer_email && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>
                      <Mail className="w-3 h-3" /> {selected.buyer_email}
                    </span>
                  )}
                </div>
              </div>

              {/* Flat info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: "Flat", value: `${selected.flat_number} · ${selected.flat_type.toUpperCase()}` },
                  { icon: User, label: "Broker", value: selected.broker_name ?? "Direct" },
                  { icon: Calendar, label: "Booked", value: dateShort(selected.booked_at) },
                  { icon: FileText, label: "Agreement", value: dateShort(selected.agreement_date) },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="rounded-xl p-3" style={{ background: "#f7f7f8" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color: "rgba(0,0,0,0.4)" }} />
                        <span style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f" }}>{f.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Money */}
              <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <IndianRupee className="w-3.5 h-3.5" style={{ color: "#0071e3" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1d1d1f" }}>Payment Summary</span>
                </div>
                {[
                  { label: "Agreement Value", value: inrFull(selected.agreement_value), bold: true },
                  { label: "Collected", value: inrFull(selected.collected), color: "#059669" },
                  { label: "Outstanding", value: inrFull(selected.pending), color: "#d97706" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderTop: r.bold ? "none" : "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.55)" }}>{r.label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: r.bold ? 700 : 600, color: r.color ?? "#1d1d1f" }}>{r.value}</span>
                  </div>
                ))}
                <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((selected.collected / (selected.agreement_value || 1)) * 100)}%`, background: "#1cc77f" }} />
                </div>
                <div className="text-center mt-1.5" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.42)" }}>
                  {Math.round((selected.collected / (selected.agreement_value || 1)) * 100)}% collected
                </div>
              </div>

              {/* Documents (mock actions) */}
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1d1d1f" }}>Documents</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Allotment Letter", "Agreement Copy", "Payment Receipts", "Cost Sheet"].map((d) => (
                    <button
                      key={d}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{ background: "#f7f7f8" }}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "#0071e3" }} />
                      <span style={{ fontSize: "0.74rem", fontWeight: 500, color: "#1d1d1f" }}>{d}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(28,199,127,0.1)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#059669" }} />
                <span style={{ fontSize: "0.76rem", color: "#059669" }}>Construction-linked payment plan active</span>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
