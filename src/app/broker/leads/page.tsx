import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, getBrokerLeads } from "@/lib/broker";
import { redirect } from "next/navigation";
import { inrShort } from "@/lib/format";
import { Phone, TrendingUp, Award, Clock } from "lucide-react";

export const metadata: Metadata = { title: "My Leads | Broker Portal" };
export const revalidate = 60;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:              { label: "New",           color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  contacted:        { label: "Contacted",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  visit_scheduled:  { label: "Visit Booked",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  negotiating:      { label: "Negotiating",   color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  won:              { label: "Won ✓",         color: "#1cc77f", bg: "rgba(28,199,127,0.1)" },
  lost:             { label: "Lost",          color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default async function BrokerLeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/broker/leads");

  const profile = await getBrokerProfile(user.id);
  if (!profile) redirect("/broker/register");

  const leads = await getBrokerLeads(profile.id);

  const totalCommission = leads.reduce((s, l) => s + (l.commission_earned ?? 0), 0);
  const wonCount = leads.filter((l) => l.status === "won").length;
  const activeCount = leads.filter((l) => !["won", "lost"].includes(l.status)).length;
  const pendingCount = leads.filter((l) => l.status === "contacted").length;

  const pipeline = [
    { label: "Active", value: activeCount, color: "#0071e3" },
    { label: "Won", value: wonCount, color: "#1cc77f" },
    { label: "Pending follow-up", value: pendingCount, color: "#f59e0b" },
    { label: "Commission earned", value: inrShort(totalCommission), color: "#a855f7" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>My Leads</h1>
        <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.48)", marginTop: 3 }}>Leads assigned to you and their status</p>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {pipeline.map((p) => (
          <div key={p.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: p.color }}>{p.value}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>{leads.length} Total Leads</h2>
        </div>

        {leads.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p style={{ fontSize: "0.9rem" }}>No leads yet. Share your referral link to get started.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {leads.map((lead) => {
              const s = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
              return (
                <div key={lead.id} className="flex items-center gap-3 px-5 py-3.5">
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
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(28,199,127,0.1)", color: "#1a7f4a" }}>
                        <Award className="w-3 h-3" /> {inrShort(lead.commission_earned)}
                      </span>
                    ) : null}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                    <a href={`tel:${lead.phone}`} className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3" }}>
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
