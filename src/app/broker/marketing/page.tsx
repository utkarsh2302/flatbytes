import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile } from "@/lib/broker";
import { redirect } from "next/navigation";
import BrokerMarketingClient from "./BrokerMarketingClient";
import { getProjectsForAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Marketing Hub | Broker Portal" };
export const dynamic = "force-dynamic";

export default async function BrokerMarketingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV === "production") redirect("/login?next=/broker/marketing");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  const projects = await getProjectsForAdmin();

  // Check Meta connection status (new columns — use any to bypass stale types)
  // eslint-disable-next-line
  const db = supabase as any;
  const { data: brokerRow } = await db
    .from("brokers")
    .select("meta_page_id, meta_page_name")
    .eq("id", profile.id)
    .single();

  return (
    <BrokerMarketingClient
      projects={projects}
      brokerId={profile.id}
      brokerName={profile.name}
      brokerPhone={profile.phone}
      metaConnected={!!(brokerRow?.meta_page_id)}
      metaPageName={brokerRow?.meta_page_name ?? null}
    />
  );
}
