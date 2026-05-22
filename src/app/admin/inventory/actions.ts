"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID = ["available", "reserved", "sold", "held", "discussion"];

export async function updateFlatStatus(formData: FormData) {
  const flatId = String(formData.get("flatId") ?? "");
  const status = String(formData.get("status") ?? "");
  const buyerName = String(formData.get("buyerName") ?? "").trim();

  if (!flatId || !VALID.includes(status)) {
    return { ok: false, error: "Invalid request" };
  }

  const supabase = createClient();
  type FlatStatusEnum = "available" | "reserved" | "sold" | "held" | "discussion";
  const patch: { status: FlatStatusEnum; buyer_name?: string | null } = { status: status as FlatStatusEnum };
  if (status === "sold" || status === "reserved") {
    if (buyerName) patch.buyer_name = buyerName;
  } else {
    patch.buyer_name = null;
  }

  const { error } = await supabase.from("flats").update(patch).eq("id", flatId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  return { ok: true };
}
