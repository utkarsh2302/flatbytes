import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile } from "@/lib/broker";
import { redirect } from "next/navigation";
import BrokerCalculatorClient from "./BrokerCalculatorClient";

export const metadata: Metadata = { title: "Commission Calculator | Broker Portal" };

export default async function BrokerCalculatorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/broker/calculator");

  const profile = await getBrokerProfile(user.id);
  if (!profile) redirect("/broker/register");

  return <BrokerCalculatorClient commissionPct={profile.commission_pct} brokerName={profile.name} />;
}
