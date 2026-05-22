import { createClient } from "@/lib/supabase/server";

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  project_id: string;
  project_name: string;
  flat_number: string | null;
  flat_type: string | null;
  floor: number | null;
  source: string;
  status: string;
  note: string | null;
  created_at: string;
}

export async function getLeadsForAdmin(): Promise<LeadRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      name,
      phone,
      project_id,
      source,
      status,
      note,
      created_at,
      projects ( name ),
      flats:viewing_flat_id ( flat_number, flat_type, floor )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    project_id: row.project_id,
    project_name: row.projects?.name ?? "—",
    flat_number: row.flats?.flat_number ?? null,
    flat_type: row.flats?.flat_type ?? null,
    floor: row.flats?.floor ?? null,
    source: row.source ?? "website",
    status: row.status ?? "new",
    note: row.note ?? null,
    created_at: row.created_at,
  }));
}

export async function getDashboardStats(orgId?: string) {
  const supabase = createClient();

  const leadsQuery = supabase.from("leads").select("status, created_at");
  const flatsQuery = supabase.from("flats").select("status");

  const [leadsRes, flatsRes] = await Promise.all([leadsQuery, flatsQuery]);

  const leads = leadsRes.data ?? [];
  const flats = flatsRes.data ?? [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new" || !l.status).length;
  const newThisWeek = leads.filter((l) => new Date(l.created_at) > weekAgo).length;
  const wonLeads = leads.filter((l) => l.status === "won").length;

  const totalFlats = flats.length;
  const availableFlats = flats.filter((f) => f.status === "available").length;
  const soldFlats = flats.filter((f) => f.status === "sold").length;
  const reservedFlats = flats.filter((f) => f.status === "reserved").length;

  return {
    totalLeads,
    newLeads,
    newThisWeek,
    wonLeads,
    totalFlats,
    availableFlats,
    soldFlats,
    reservedFlats,
  };
}
