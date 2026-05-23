"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function scheduleVisit(leadId: string, visitDate: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: "visit_scheduled", next_followup_at: visitDate })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/visits");
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function markVisitAttended(leadId: string, feedback: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      status: "negotiating",
      stage: "site_visit",
      note: feedback || undefined,
    })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/visits");
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function markVisitNoShow(leadId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: "contacted", stage: "no_show" })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/visits");
  return { ok: true };
}
