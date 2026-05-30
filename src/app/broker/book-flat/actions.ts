"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile } from "@/lib/broker";
import { revalidatePath } from "next/cache";

export interface BookFlatInput {
  flatId: string;
  projectId: string;
  agreementValue: number;
  buyerName: string;
  buyerPhone: string;
  notes?: string;
}

export async function bookFlat(input: BookFlatInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await resolveBrokerProfile(user?.id ?? null);

  if (!profile || profile.id === "preview-broker") {
    return { ok: false, error: "No active broker account is linked. Log in as a broker to record bookings." };
  }
  if (!input.flatId || !input.projectId) return { ok: false, error: "Please choose a project and a flat." };
  if (!input.buyerName?.trim() || !input.buyerPhone?.trim()) {
    return { ok: false, error: "Client name and phone number are required." };
  }

  // eslint-disable-next-line
  const db = supabase as any;

  const { error } = await db.from("bookings").insert({
    org_id: profile.org_id,
    project_id: input.projectId,
    flat_id: input.flatId,
    broker_id: profile.id,
    buyer_name: input.buyerName.trim(),
    buyer_phone: input.buyerPhone.trim(),
    agreement_value: input.agreementValue,
    status: "booked",
    booked_at: new Date().toISOString(),
    notes: input.notes?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };

  // Take the flat out of available inventory
  await db.from("flats").update({ status: "booked" }).eq("id", input.flatId);

  revalidatePath("/broker/book-flat");
  revalidatePath("/broker/inventory");
  revalidatePath("/broker");
  return { ok: true };
}
