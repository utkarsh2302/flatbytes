import { getBrokersWithStats } from "@/lib/saas";
import { inrShort, inrFull } from "@/lib/format";
import { Award, Users, IndianRupee, TrendingUp, Phone, Mail, BadgeCheck } from "lucide-react";

export const revalidate = 30;

const TIER_META: Record<string, { label: string; color: string; bg: string }> = {
  premium: { label: "Premium Partner", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  free: { label: "Standard", color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

export default async function BrokersPage() {
  const brokers = await getBrokersWithStats();
  const ranked = [...brokers].sort((a, b) => b.gross_value - a.gross_value);

  const totalCommission = brokers.reduce((s, b) => s + b.commission, 0);
  const totalGross = brokers.reduce((s, b) => s + b.gross_value, 0);
  const totalBookings = brokers.reduce((s, b) => s + b.bookings_count, 0);

  const summary = [
    { label: "Channel Partners", value: String(brokers.length), icon: Users, accent: "#0071e3" },
    { label: "Sales via Brokers", value: inrShort(totalGross), icon: TrendingUp, accent: "#1cc77f" },
    { label: "Commission Payable", value: inrShort(totalCommission), icon: IndianRupee, accent: "#f59e0b" },
    { label: "Broker Bookings", value: String(totalBookings), icon: Award, accent: "#a855f7" },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Broker Portal</h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Channel partners, sales contribution, and commission tracking.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.accent}14` }}>
                <Icon style={{ color: s.accent, width: 18, height: 18 }} />
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1d1d1f" }}>{s.value}</div>
              <div style={{ fontSize: "0.76rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <h2 className="mb-3" style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Performance Leaderboard</h2>
      <div className="space-y-3">
        {ranked.map((b, i) => {
          const tier = TIER_META[b.tier] ?? TIER_META.free;
          return (
            <div
              key={b.id}
              className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              {/* Rank */}
              <div
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold"
                style={{
                  background: i < 3 ? RANK_COLORS[i] : "#f0f0f2",
                  color: i < 3 ? "#fff" : "rgba(0,0,0,0.4)",
                  fontSize: "1rem",
                }}
              >
                {i + 1}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>{b.name}</span>
                  <span className="px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ fontSize: "0.66rem", fontWeight: 600, color: tier.color, background: tier.bg }}>
                    {b.tier === "premium" && <BadgeCheck className="w-3 h-3" />}
                    {tier.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  <span className="flex items-center gap-1" style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.45)" }}>
                    <Phone className="w-3 h-3" /> {b.phone}
                  </span>
                  {b.email && (
                    <span className="flex items-center gap-1" style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.45)" }}>
                      <Mail className="w-3 h-3" /> {b.email}
                    </span>
                  )}
                  {b.rera_id && (
                    <span style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.4)" }}>RERA · {b.rera_id}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 shrink-0">
                {[
                  { label: "Bookings", value: String(b.bookings_count) },
                  { label: "Sales Value", value: inrShort(b.gross_value) },
                  { label: `Commission @ ${b.commission_pct}%`, value: inrFull(b.commission), accent: "#f59e0b" },
                ].map((st) => (
                  <div key={st.label}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: st.accent ?? "#1d1d1f" }}>{st.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.42)" }}>{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {brokers.length === 0 && (
          <div className="rounded-2xl py-16 text-center" style={{ background: "#fff", color: "rgba(0,0,0,0.35)" }}>
            <Users className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "0.9rem" }}>No brokers registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
