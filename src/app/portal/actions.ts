"use server";

import { getCustomerByPhone, type CustomerData } from "@/lib/saas";

export async function lookupCustomer(phone: string): Promise<{ ok: boolean; data?: CustomerData; error?: string }> {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 10) return { ok: false, error: "Enter a valid 10-digit phone number" };
  const data = await getCustomerByPhone(clean);
  if (!data) return { ok: false, error: "No booking found for this number. Try one of the demo numbers below." };
  return { ok: true, data };
}
