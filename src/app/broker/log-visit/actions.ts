"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile } from "@/lib/broker";
import { revalidatePath } from "next/cache";

export interface LogVisitInput {
  clientName: string;
  clientPhone: string;
  projectId: string;
  flatId?: string;
  notes?: string;
}

export async function logVisit(input: LogVisitInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await resolveBrokerProfile(user?.id ?? null);

  if (!profile || profile.id === "preview-broker") {
    return { ok: false, error: "No active broker account is linked. Log in as a broker to log visits." };
  }
  if (!input.clientName?.trim() || !input.clientPhone?.trim()) {
    return { ok: false, error: "Client name and phone number are required." };
  }
  if (!input.projectId) return { ok: false, error: "Please choose the project the client visited." };

  // eslint-disable-next-line
  const db = supabase as any;

  // 1. Create a lead for this visited client
  const { data: lead, error: leadErr } = await db
    .from("leads")
    .insert({
      org_id: profile.org_id,
      name: input.clientName.trim(),
      phone: input.clientPhone.trim(),
      project_id: input.projectId,
      source: "broker_visit",
      stage: "visited",
      status: "visited",
      note: input.notes?.trim() || null,
      viewing_flat_id: input.flatId || null,
    })
    .select("id")
    .single();

  if (leadErr || !lead) return { ok: false, error: leadErr?.message ?? "Could not save the visit." };

  // 2. Assign the lead to this broker
  await db.from("broker_assignments").insert({
    broker_id: profile.id,
    lead_id: lead.id,
    flat_id: input.flatId || null,
    status: "visited",
  });

  revalidatePath("/broker/log-visit");
  revalidatePath("/broker/leads");
  revalidatePath("/broker");
  return { ok: true };
}
