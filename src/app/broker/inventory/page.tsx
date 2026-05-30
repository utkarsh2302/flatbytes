import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, getBrokerInventory, resolveBrokerProfile } from "@/lib/broker";
import { DEMO_OPEN_ACCESS } from "@/lib/demo";
import { redirect } from "next/navigation";
import BrokerInventoryClient from "./BrokerInventoryClient";

export const metadata: Metadata = { title: "Live Inventory | Broker Portal" };
export const revalidate = 30;

export default async function BrokerInventoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !DEMO_OPEN_ACCESS) redirect("/login?next=/broker/inventory");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  const flats = await getBrokerInventory(profile.org_id);

  return <BrokerInventoryClient flats={flats} brokerId={profile.id} brokerName={profile.name} commissionPct={profile.commission_pct} />;
}
