import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AIInsightsClient from "./AIInsightsClient";

export const metadata: Metadata = { title: "AI Insights | Admin" };
export const revalidate = 300;

interface ScoredLead {
  id: string; name: string; phone: string;
  project_name: string; status: string; source: string;
  created_at: string; score: number; budget_min: number | null;
  preferred_bhk: string[] | null;
}

function computeLeadScore(lead: any): number {
  let score = 30;
  // Source scoring
  if (lead.source === "broker") score += 25;
  else if (lead.source === "referral") score += 20;
  else if (lead.source === "website") score += 15;
  else if (lead.source === "walk_in") score += 30;
  // Status/stage progression
  if (lead.status === "negotiating") score += 30;
  else if (lead.status === "visit_scheduled") score += 25;
  else if (lead.stage === "site_visit") score += 20;
  else if (lead.status === "contacted") score += 10;
  // Budget (higher budget = more serious)
  if (lead.budget_min && lead.budget_min > 8000000) score += 15;
  else if (lead.budget_min && lead.budget_min > 5000000) score += 8;
  // Recent activity (within 7 days)
  const daysSince = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 2) score += 10;
  else if (daysSince < 7) score += 5;
  else if (daysSince > 30) score -= 10;
  // BHK preference specified = serious buyer
  if (lead.preferred_bhk?.length) score += 5;
  return Math.min(100, Math.max(0, score));
}

export default async function AIInsightsPage() {
  const supabase = createClient();

  const [leadsRes, bookingsRes, projectsRes] = await Promise.all([
    supabase.from("leads").select("id, name, phone, status, stage, source, created_at, budget_min, preferred_bhk, next_followup_at, projects:project_id(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("bookings").select("id, status, agreement_value, created_at, projects:project_id(name)").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name"),
  ]);

  const rawLeads = leadsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  const scoredLeads: ScoredLead[] = rawLeads
    .map((l: any) => ({
      id: l.id, name: l.name, phone: l.phone,
      project_name: l.projects?.name ?? "—",
      status: l.status, source: l.source,
      created_at: l.created_at,
      score: computeLeadScore(l),
      budget_min: l.budget_min ?? null,
      preferred_bhk: l.preferred_bhk ?? null,
    }))
    .sort((a, b) => b.score - a.score);

  const hotLeads = scoredLeads.filter((l) => l.score >= 70).slice(0, 10);
  const warmLeads = scoredLeads.filter((l) => l.score >= 40 && l.score < 70).slice(0, 8);

  // Follow-up recommendations: leads not touched in 3-7 days
  const followUpDue = rawLeads.filter((l: any) => {
    const days = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 3 && days <= 14 && !["won", "lost"].includes(l.status);
  }).slice(0, 8).map((l: any) => ({
    id: l.id, name: l.name, phone: l.phone,
    project_name: l.projects?.name ?? "—",
    days_since: Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    status: l.status,
  }));

  // Monthly booking trend (last 6 months)
  const monthlyBookings: { month: string; count: number; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
    const mb = bookings.filter((b: any) => b.created_at >= monthStart && b.created_at <= monthEnd && b.status !== "cancelled");
    monthlyBookings.push({ month: monthStr, count: mb.length, value: mb.reduce((s, b: any) => s + Number(b.agreement_value), 0) });
  }

  // Conversion funnel
  const funnelStages = [
    { label: "Total Leads", count: rawLeads.length, color: "#0071e3" },
    { label: "Contacted", count: rawLeads.filter((l: any) => l.status !== "new").length, color: "#a855f7" },
    { label: "Visit Scheduled", count: rawLeads.filter((l: any) => l.status === "visit_scheduled").length, color: "#f59e0b" },
    { label: "Negotiating", count: rawLeads.filter((l: any) => l.status === "negotiating").length, color: "#f97316" },
    { label: "Booked", count: bookings.filter((b: any) => b.status !== "cancelled").length, color: "#1cc77f" },
  ];

  const avgScore = scoredLeads.length ? Math.round(scoredLeads.reduce((s, l) => s + l.score, 0) / scoredLeads.length) : 0;
  const projectedBookings = Math.round(hotLeads.length * 0.4 + warmLeads.length * 0.15);

  return (
    <AIInsightsClient
      hotLeads={hotLeads}
      warmLeads={warmLeads}
      followUpDue={followUpDue}
      funnelStages={funnelStages}
      monthlyBookings={monthlyBookings}
      avgScore={avgScore}
      projectedBookings={projectedBookings}
      totalLeads={rawLeads.length}
    />
  );
}
