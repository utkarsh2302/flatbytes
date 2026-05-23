import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import WhatsAppClient from "./WhatsAppClient";

export const metadata: Metadata = { title: "WhatsApp Automation | Admin" };
export const revalidate = 60;

export default async function WhatsAppPage() {
  const supabase = createClient();
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
  return <WhatsAppClient leadCount={count ?? 0} />;
}
