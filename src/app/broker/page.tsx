import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, getBrokerStats, getBrokerLeads, resolveBrokerProfile } from "@/lib/broker";
import { inrShort, inrFull } from "@/lib/format";
import { redirect } from "next/navigation";
import { TrendingUp, IndianRupee, Users, Award, Clock, Phone, ChevronRight, Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Broker Dashboard | FlatBytes" };
export const revalidate = 60;

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6", contacted: "#f59e0b", visit_scheduled: "#8b5cf6",
  negotiating: "#f97316", won: "#1cc77f", lost: "#ef4444",
};

export default async function BrokerDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV === "production") redirect("/login?next=/broker");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  const [stats, leads] = await Promise.all([
    getBrokerStats(profile.id),
    getBrokerLeads(profile.id),
  ]);

  const recentLeads = leads.slice(0, 5);
  const conversionRate = leads.length > 0 ? Math.round((stats.wonLeads / leads.length) * 100) : 0;
  const isPremium = profile.tier === "premium";

  const kpis = [
    { label: "Active Leads", value: String(stats.activeLeads), icon: Users, color: "#0071e3" },
    { label: "Bookings Won", value: String(stats.wonLeads), icon: Award, color: "#1cc77f" },
    { label: "Gross Value", value: inrShort(stats.grossBookingValue), icon: TrendingUp, color: "#f59e0b" },
    { label: "Commission Earned", value: inrShort(stats.totalCommissionEarned), icon: IndianRupee, color: "#a855f7" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0071e3 0%, #0055b3 100%)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>Welcome, {profile.name.split(" ")[0]} 👋</h1>
            {isPremium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", fontSize: "0.68rem", fontWeight: 700, color: "#fff" }}>
                <Star className="w-3 h-3" fill="currentColor" /> PREMIUM
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>
            {profile.rera_id ? `RERA: ${profile.rera_id} · ` : ""}{profile.commission_pct}% commission · {conversionRate}% conversion rate
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/broker/inventory" className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", textDecoration: "none" }}>
            View Inventory
          </Link>
          <Link href="/broker/calculator" className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#fff", color: "#0071e3", textDecoration: "none" }}>
            Calculate EMI
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}14` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: k.color, width: 18, height: 18 }} />
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f" }}>{k.value}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="lg:col-span-2 rounded-2xl" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>Recent Leads</h2>
            <Link href="/broker/leads" style={{ fontSize: "0.78rem", color: "#0071e3", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {recentLeads.length === 0 ? (
              <div className="py-10 text-center" style={{ color: "rgba(0,0,0,0.35)", fontSize: "0.85rem" }}>
                No leads assigned yet. Share your link to get started!
              </div>
            ) : recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: "#f5f5f7", color: "#1d1d1f" }}>
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1d1d1f" }}>{lead.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)" }}>{lead.project_name}{lead.flat_number ? ` · Flat ${lead.flat_number}` : ""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.commission_earned && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1a7f4a" }}>+{inrShort(lead.commission_earned)}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${LEAD_STATUS_COLORS[lead.status] ?? "#64748b"}18`, color: LEAD_STATUS_COLORS[lead.status] ?? "#64748b" }}>
                    {lead.status.replace("_", " ")}
                  </span>
                  <a href={`tel:${lead.phone}`} style={{ color: "rgba(0,0,0,0.3)", display: "flex" }}>
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Browse Available Flats", href: "/broker/inventory", emoji: "🏢" },
                { label: "Share Project Link", href: "/broker/marketing", emoji: "📲" },
                { label: "Calculate Commission", href: "/broker/calculator", emoji: "💰" },
                { label: "Download Brochure", href: "/broker/marketing", emoji: "📄" },
              ].map((a) => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: "#f5f5f7", textDecoration: "none" }}
                  onMouseEnter={() => {}} onMouseLeave={() => {}}>
                  <span style={{ fontSize: "1.1rem" }}>{a.emoji}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#1d1d1f" }}>{a.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(0,0,0,0.3)" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Commission tier */}
          <div className="rounded-2xl p-4" style={{ background: isPremium ? "linear-gradient(135deg,#7c3aed,#5b21b6)" : "#f5f5f7", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: isPremium ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.4)", marginBottom: 4 }}>YOUR TIER</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: isPremium ? "#fff" : "#1d1d1f" }}>
              {isPremium ? "⭐ Premium Partner" : "Standard"}
            </div>
            <div style={{ fontSize: "0.78rem", color: isPremium ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)", marginTop: 2 }}>
              {profile.commission_pct}% commission on all bookings
            </div>
            {!isPremium && (
              <div className="mt-3 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                Close 3+ bookings to unlock Premium (higher commission + priority leads)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending follow-ups */}
      {leads.filter((l) => l.status === "contacted").length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "#f97316" }} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f" }}>
              {leads.filter((l) => l.status === "contacted").length} leads awaiting follow-up
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {leads.filter((l) => l.status === "contacted").slice(0, 4).map((lead) => (
              <div key={lead.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "#fff", border: "1px solid rgba(249,115,22,0.15)" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1d1d1f" }}>{lead.name}</span>
                <a href={`tel:${lead.phone}`} className="flex items-center justify-center w-6 h-6 rounded-full"
                  style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
                  <Phone className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
