"use server";

import { createClient } from "@/lib/supabase/server";
import type { FlatStatus } from "@/lib/types";

export async function updateFlatStatus(flatId: string, status: FlatStatus) {
  const supabase = createClient();
  const { error } = await supabase
    .from("flats")
    .update({ status })
    .eq("id", flatId);
  if (error) throw new Error(error.message);
}

export async function submitLead(data: {
  project_id: string;
  flat_id?: string | null;
  name: string;
  phone: string;
  source?: string;
  note?: string;
}) {
  // Validate phone (10–12 digits after stripping non-numerics)
  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 12) {
    throw new Error("Please enter a valid 10-digit phone number.");
  }

  const supabase = createClient();

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("org_id")
    .eq("id", data.project_id)
    .single();

  if (projectErr || !project?.org_id) {
    throw new Error("Project not found.");
  }

  const { error } = await supabase.from("leads").insert({
    project_id: data.project_id,
    viewing_flat_id: data.flat_id ?? null,
    name: data.name.trim(),
    phone: digits,
    org_id: project.org_id,
    source: data.source ?? "website",
    note: data.note ?? null,
  });

  if (error) throw new Error(error.message);
}

export type LeadStatus = "new" | "contacted" | "visit_scheduled" | "negotiating" | "won" | "lost";

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
}

export async function updateLeadNote(leadId: string, note: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ note })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
}
