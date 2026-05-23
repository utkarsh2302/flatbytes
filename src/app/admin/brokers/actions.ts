"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveBroker(brokerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("brokers").update({ is_active: true }).eq("id", brokerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}

export async function rejectBroker(brokerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("brokers").delete().eq("id", brokerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}

export async function updateBrokerCommission(brokerId: string, commissionPct: number) {
  if (commissionPct < 0 || commissionPct > 10) return { ok: false, error: "Commission must be 0–10%" };
  const supabase = createClient();
  const { error } = await supabase.from("brokers").update({ commission_pct: commissionPct }).eq("id", brokerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}

export async function updateBrokerTier(brokerId: string, tier: "free" | "premium") {
  const supabase = createClient();
  const patch: { tier: string; premium_started_at?: string; premium_expires_at?: string | null } = { tier };
  if (tier === "premium") {
    const now = new Date().toISOString();
    const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    patch.premium_started_at = now;
    patch.premium_expires_at = expiry;
  } else {
    patch.premium_expires_at = null;
  }
  const { error } = await supabase.from("brokers").update(patch).eq("id", brokerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}

export async function assignBrokerProject(brokerId: string, projectId: string) {
  const supabase = createClient();
  const code = `${brokerId.slice(0, 6)}-${projectId.slice(0, 6)}`;
  const { error } = await supabase.from("broker_links").upsert(
    { broker_id: brokerId, project_id: projectId, code, is_active: true },
    { onConflict: "broker_id,project_id", ignoreDuplicates: false }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}

export async function unassignBrokerProject(brokerId: string, projectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("broker_links").delete().eq("broker_id", brokerId).eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/brokers");
  return { ok: true };
}
