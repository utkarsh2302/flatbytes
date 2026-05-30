import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, resolveBrokerProfile } from "@/lib/broker";
import { DEMO_OPEN_ACCESS } from "@/lib/demo";
import { redirect } from "next/navigation";
import BrokerCalculatorClient from "./BrokerCalculatorClient";

export const metadata: Metadata = { title: "Commission Calculator | Broker Portal" };

export default async function BrokerCalculatorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !DEMO_OPEN_ACCESS) redirect("/login?next=/broker/calculator");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  return <BrokerCalculatorClient commissionPct={profile.commission_pct} brokerName={profile.name} />;
}
