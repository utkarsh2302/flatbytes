import { createClient } from "@/lib/supabase/server";
import { inrShort } from "@/lib/format";

export type ActivityType = 'call' | 'whatsapp' | 'site_visit' | 'note' | 'stage_change'

export interface BrokerActivity {
  id: string
  assignmentId: string | null
  leadId: string
  brokerId: string
  type: ActivityType
  note: string
  createdAt: string
}

export interface BrokerProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  rera_id: string | null;
  commission_pct: number;
  tier: string;
  is_active: boolean;
  org_id: string;
  bio: string | null;
  total_clicks: number;
  total_conversions: number;
  total_sales: number;
  total_commission: number;
  user_id: string | null;
}

export interface BrokerLead {
  id: string;            // lead ID
  assignmentId: string;  // broker_assignments.id
  name: string;
  phone: string;
  status: string;
  stage: string | null;
  source: string;
  created_at: string;
  project_name: string;
  flat_number: string | null;
  commission_earned: number | null;
  assignment_status: string | null;
}

export interface BrokerInventoryFlat {
  id: string;
  flat_number: string;
  floor: number;
  flat_type: string;
  carpet_area_sqft: number;
  total_price: number;
  price_per_sqft: number | null;
  facing: string | null;
  status: string;
  project_name: string;
  project_id: string;
  tower_name: string | null;
  bathrooms: number | null;
}

/** Resolves a broker profile for a page — uses first DB broker in dev when no session */
export async function resolveBrokerProfile(userId: string | null): Promise<BrokerProfile | null> {
  if (userId) return getBrokerProfile(userId);
  if (process.env.NODE_ENV !== "production") return getFirstBrokerForPreview();
  return null;
}

/** Dev-only: returns the first broker (any status) for local preview without login */
export async function getFirstBrokerForPreview(): Promise<BrokerProfile> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brokers")
    .select("*")
    .limit(1)
    .maybeSingle();

  // If no broker in DB at all, return a mock profile so pages render
  if (!data) {
    return {
      id: "preview-broker",
      name: "Preview Broker",
      phone: "9999999999",
      email: "preview@flatbytes.in",
      rera_id: null,
      commission_pct: 2,
      tier: "free",
      is_active: true,
      org_id: "preview-org",
      bio: null,
      total_clicks: 0,
      total_conversions: 0,
      total_sales: 0,
      total_commission: 0,
      user_id: null,
    };
  }

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    rera_id: data.rera_id,
    commission_pct: data.commission_pct ?? 2,
    tier: data.tier ?? "free",
    is_active: data.is_active ?? true,
    org_id: data.org_id,
    bio: data.bio,
    total_clicks: data.total_clicks ?? 0,
    total_conversions: data.total_conversions ?? 0,
    total_sales: data.total_sales ?? 0,
    total_commission: data.total_commission ?? 0,
    user_id: data.user_id,
  };
}

export async function getBrokerProfile(userId: string): Promise<BrokerProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brokers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    rera_id: data.rera_id,
    commission_pct: data.commission_pct ?? 2,
    tier: data.tier ?? "free",
    is_active: data.is_active ?? false,
    org_id: data.org_id,
    bio: data.bio,
    total_clicks: data.total_clicks ?? 0,
    total_conversions: data.total_conversions ?? 0,
    total_sales: data.total_sales ?? 0,
    total_commission: data.total_commission ?? 0,
    user_id: data.user_id,
  };
}

export async function getBrokerLeads(brokerId: string): Promise<BrokerLead[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("broker_assignments")
    .select(`
      id, status, commission_earned,
      leads:lead_id ( id, name, phone, status, stage, source, created_at,
        projects:project_id ( name ),
        flats:viewing_flat_id ( flat_number )
      )
    `)
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => ({
    id: row.leads?.id ?? row.id,
    assignmentId: row.id,
    name: row.leads?.name ?? "—",
    phone: row.leads?.phone ?? "—",
    status: row.leads?.status ?? "new",
    stage: row.leads?.stage ?? null,
    source: row.leads?.source ?? "broker",
    created_at: row.leads?.created_at ?? "",
    project_name: row.leads?.projects?.name ?? "—",
    flat_number: row.leads?.flats?.flat_number ?? null,
    commission_earned: row.commission_earned ? Number(row.commission_earned) : null,
    assignment_status: row.status,
  }));
}

export async function getBrokerInventory(orgId: string): Promise<BrokerInventoryFlat[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("flats")
    .select(`
      id, flat_number, floor, flat_type, carpet_area_sqft, total_price,
      price_per_sqft, facing, status, bathrooms,
      projects:project_id ( id, name ),
      towers:tower_id ( name )
    `)
    .eq("status", "available")
    .order("total_price", { ascending: true });

  return (data ?? []).map((f: any) => ({
    id: f.id,
    flat_number: f.flat_number,
    floor: f.floor,
    flat_type: f.flat_type,
    carpet_area_sqft: Number(f.carpet_area_sqft),
    total_price: Number(f.total_price),
    price_per_sqft: f.price_per_sqft ? Number(f.price_per_sqft) : null,
    facing: f.facing,
    status: f.status,
    project_name: f.projects?.name ?? "—",
    project_id: f.projects?.id ?? "",
    tower_name: f.towers?.name ?? null,
    bathrooms: f.bathrooms,
  }));
}

export async function getBrokerStats(brokerId: string) {
  const supabase = createClient();
  const [assignmentsRes, bookingsRes] = await Promise.all([
    supabase.from("broker_assignments").select("status, commission_earned").eq("broker_id", brokerId),
    supabase.from("bookings").select("agreement_value, status").eq("broker_id", brokerId),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  const activeLeads = assignments.filter((a) => !["lost", "won"].includes(a.status ?? "")).length;
  const wonLeads = assignments.filter((a) => a.status === "won").length;
  const totalCommissionEarned = assignments.reduce((s, a) => s + (Number(a.commission_earned) || 0), 0);
  const grossBookingValue = bookings.reduce((s, b) => s + Number(b.agreement_value), 0);

  return { activeLeads, wonLeads, totalCommissionEarned, grossBookingValue };
}

// ── Activity timeline ─────────────────────────────────────────────────────────

// New tables not yet in generated types — cast to bypass type checking
// eslint-disable-next-line
type AnyClient = any

export async function getActivitiesForLead(leadId: string): Promise<BrokerActivity[]> {
  const supabase = createClient() as AnyClient;
  const { data } = await supabase
    .from("broker_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Record<string, string>[]).map((r) => ({
    id: r.id,
    assignmentId: r.assignment_id ?? null,
    leadId: r.lead_id,
    brokerId: r.broker_id,
    type: r.type as ActivityType,
    note: r.note,
    createdAt: r.created_at,
  }));
}

export async function addBrokerActivity(params: {
  assignmentId?: string;
  leadId: string;
  brokerId: string;
  orgId: string;
  type: ActivityType;
  note: string;
}): Promise<BrokerActivity | null> {
  const supabase = createClient() as AnyClient;
  const { data, error } = await supabase
    .from("broker_activities")
    .insert({
      assignment_id: params.assignmentId ?? null,
      lead_id: params.leadId,
      broker_id: params.brokerId,
      org_id: params.orgId,
      type: params.type,
      note: params.note,
    })
    .select()
    .single();
  if (error || !data) return null;
  const r = data as Record<string, string>;
  return {
    id: r.id,
    assignmentId: r.assignment_id ?? null,
    leadId: r.lead_id,
    brokerId: r.broker_id,
    type: r.type as ActivityType,
    note: r.note,
    createdAt: r.created_at,
  };
}

export async function updateLeadStage(assignmentId: string, stage: string): Promise<boolean> {
  const supabase = createClient() as AnyClient;
  const { error } = await supabase
    .from("broker_assignments")
    .update({ status: stage, last_activity_at: new Date().toISOString() })
    .eq("id", assignmentId);
  return !error;
}
