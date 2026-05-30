import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, getBrokerLeads, getActivitiesForLead } from "@/lib/broker";
import { redirect } from "next/navigation";
import { inrShort } from "@/lib/format";
import BrokerLeadsClient from "./BrokerLeadsClient";

export const metadata: Metadata = { title: "My Leads | Broker Portal" };
export const dynamic = "force-dynamic";

export default async function BrokerLeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/broker/leads");

  const profile = await getBrokerProfile(user.id);
  if (!profile) redirect("/broker/register");

  const leads = await getBrokerLeads(profile.id);

  // Pre-fetch activities for all leads (up to 5 most recent per lead)
  const activitiesByLead: Record<string, Awaited<ReturnType<typeof getActivitiesForLead>>> = {}
  await Promise.all(
    leads.slice(0, 20).map(async (l) => {
      activitiesByLead[l.id] = await getActivitiesForLead(l.id)
    })
  )

  const stats = {
    totalCommission: leads.reduce((s, l) => s + (l.commission_earned ?? 0), 0),
    wonCount: leads.filter((l) => l.status === "won").length,
    activeCount: leads.filter((l) => !["won", "lost"].includes(l.status)).length,
    pendingCount: leads.filter((l) => l.status === "contacted").length,
  };

  return (
    <BrokerLeadsClient
      leads={leads}
      activitiesByLead={activitiesByLead}
      stats={stats}
      brokerId={profile.id}
      orgId={profile.org_id}
    />
  );
}
