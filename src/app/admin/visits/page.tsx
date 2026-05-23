import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SiteVisitsClient from "./SiteVisitsClient";

export const metadata: Metadata = { title: "Site Visits | Admin" };
export const revalidate = 30;

export default async function SiteVisitsPage() {
  const supabase = createClient();

  const [visitRes, pendingRes, bookingsRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, phone, status, stage, next_followup_at, viewing_flat_id, projects:project_id(name), flats:viewing_flat_id(flat_number)")
      .eq("status", "visit_scheduled")
      .order("next_followup_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, phone, created_at, projects:project_id(name)")
      .in("status", ["new", "contacted"])
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("bookings")
      .select("id")
      .not("id", "is", null),
  ]);

  const visitLeads = (visitRes.data ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    project_name: l.projects?.name ?? "—",
    visit_date: l.next_followup_at ?? null,
    flat_number: l.flats?.flat_number ?? null,
    status: l.status,
  }));

  const pendingLeads = (pendingRes.data ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    project_name: l.projects?.name ?? "—",
    created_at: l.created_at,
  }));

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const thisWeek = visitLeads.filter((v) => {
    if (!v.visit_date) return false;
    const d = new Date(v.visit_date);
    return d >= weekStart && d < weekEnd;
  }).length;

  const totalBookings = bookingsRes.data?.length ?? 0;
  const attended = visitLeads.filter((v) => v.status === "negotiating").length;
  const conversionPct = visitLeads.length > 0 ? Math.round((totalBookings / Math.max(1, visitLeads.length + attended)) * 100) : 0;

  return (
    <SiteVisitsClient
      scheduled={visitLeads}
      pending={pendingLeads}
      stats={{ total: visitLeads.length, thisWeek, attended, conversionPct }}
    />
  );
}
