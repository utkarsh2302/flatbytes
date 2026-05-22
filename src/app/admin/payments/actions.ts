"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordPayment(formData: FormData) {
  const scheduleId = String(formData.get("scheduleId") ?? "");
  const mode = String(formData.get("mode") ?? "bank_transfer");
  if (!scheduleId) return { ok: false, error: "Missing installment" };

  const supabase = createClient();

  const { data: row } = await supabase
    .from("payment_schedule")
    .select("id, org_id, booking_id, amount, milestone_label")
    .eq("id", scheduleId)
    .maybeSingle();

  if (!row) return { ok: false, error: "Installment not found" };

  const { error } = await supabase
    .from("payment_schedule")
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      payment_mode: mode,
      transaction_ref: "TXN" + Math.floor(100000 + Math.random() * 900000),
    })
    .eq("id", scheduleId);

  if (error) return { ok: false, error: error.message };

  // Generate a receipt
  const { data: booking } = await supabase
    .from("bookings")
    .select("buyer_name, buyer_phone, flats:flat_id ( flat_number ), projects ( name )")
    .eq("id", row.booking_id)
    .maybeSingle();

  const { count } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true });

  await supabase.from("receipts").insert({
    org_id: row.org_id,
    booking_id: row.booking_id,
    payment_schedule_id: row.id,
    receipt_number: "RCP/2526/" + String((count ?? 0) + 1).padStart(4, "0"),
    amount: row.amount,
    payment_mode: mode,
    payment_date: new Date().toISOString().slice(0, 10),
    buyer_name: (booking as any)?.buyer_name ?? "",
    buyer_phone: (booking as any)?.buyer_phone ?? "",
    flat_details: {
      flat_number: (booking as any)?.flats?.flat_number ?? "",
      project: (booking as any)?.projects?.name ?? "",
      milestone: row.milestone_label,
    },
  });

  revalidatePath("/admin/payments");
  return { ok: true };
}
