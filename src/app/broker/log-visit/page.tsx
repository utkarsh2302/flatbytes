import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile, getBrokerInventory } from "@/lib/broker";
import { DEMO_OPEN_ACCESS } from "@/lib/demo";
import { redirect } from "next/navigation";
import LogVisitClient from "./LogVisitClient";

export const metadata: Metadata = { title: "Log Visit | Broker Portal" };
export const dynamic = "force-dynamic";

export default async function LogVisitPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !DEMO_OPEN_ACCESS) redirect("/login?next=/broker/log-visit");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  // eslint-disable-next-line
  const db = supabase as any;

  const { data: projectRows } = await db
    .from("projects")
    .select("id, name, location")
    .order("name");
  const projects = (projectRows ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    location: (p.location as string) ?? "",
  }));

  // Flats per project (to optionally tag which unit was shown)
  const inventory = await getBrokerInventory(profile.org_id);
  const flats = inventory.map((f) => ({
    id: f.id, projectId: f.project_id, label: `Flat ${f.flat_number} · ${f.flat_type} · Floor ${f.floor}`,
  }));

  const { data: visitRows } = await db
    .from("broker_assignments")
    .select("id, assigned_at, status, leads:lead_id(name, phone, source, note, projects:project_id(name))")
    .eq("broker_id", profile.id)
    .order("assigned_at", { ascending: false })
    .limit(10);

  const recent = (visitRows ?? [])
    .map((r: Record<string, unknown>) => {
      const lead = r.leads as { name?: string; phone?: string; source?: string; note?: string; projects?: { name?: string } } | null;
      return {
        id: r.id as string,
        name: lead?.name ?? "—",
        phone: lead?.phone ?? "—",
        source: lead?.source ?? "",
        note: lead?.note ?? "",
        projectName: lead?.projects?.name ?? "—",
        at: (r.assigned_at as string) ?? "",
      };
    })
    .filter((v: { source: string }) => v.source === "broker_visit");

  return <LogVisitClient projects={projects} flats={flats} recent={recent} />;
}
