import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile } from "@/lib/broker";
import { redirect } from "next/navigation";
import BrokerMarketingClient from "./BrokerMarketingClient";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Marketing Kit | Broker Portal" };
export const revalidate = 3600;

export default async function BrokerMarketingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/broker/marketing");

  const profile = await getBrokerProfile(user.id);
  if (!profile) redirect("/broker/register");

  const projects = await getProjects();

  return <BrokerMarketingClient projects={projects} brokerId={profile.id} brokerName={profile.name} brokerPhone={profile.phone} />;
}
