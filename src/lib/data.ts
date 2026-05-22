import { createClient } from "@/lib/supabase/server";
import type { Project, Tower, Flat, Amenity, ConstructionMilestone, FlatType, FlatStatus, ProjectType } from "@/lib/types";

function mapFlat(row: any): Flat {
  return {
    id: row.id,
    project_id: row.project_id,
    tower_id: row.tower_id ?? null,
    tower: row.tower ?? "",
    flat_number: row.flat_number,
    floor: row.floor,
    flat_type: row.flat_type as FlatType,
    carpet_area_sqft: Number(row.carpet_area_sqft),
    super_area_sqft: row.super_area_sqft ? Number(row.super_area_sqft) : null,
    facing: row.facing ?? null,
    price_per_sqft: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    total_price: Number(row.total_price),
    floor_plan_url: row.floor_plan_url ?? null,
    view_360_url: row.view_360_url ?? null,
    status: row.status as FlatStatus,
    buyer_name: row.buyer_name ?? null,
    position_on_floor: row.position_on_floor ?? null,
    bathrooms: row.bathrooms ?? null,
    balcony_count: row.balcony_count ?? null,
  };
}

function mapProject(row: any, towers: Tower[], amenities: Amenity[], milestones: ConstructionMilestone[]): Project {
  return {
    id: row.id,
    org_id: row.org_id,
    name: row.name,
    location: row.location,
    city: row.city ?? null,
    rera_number: row.rera_number ?? null,
    description: row.description ?? null,
    cover_image_url: row.cover_image_url ?? null,
    model_3d_url: row.model_3d_url ?? null,
    total_towers: row.total_towers ?? null,
    total_floors: row.total_floors ?? null,
    flats_per_floor: row.flats_per_floor ?? null,
    possession_date: row.possession_date ?? null,
    construction_stage: row.construction_stage ?? null,
    construction_percentage: row.construction_percentage ?? null,
    status: row.status,
    project_type: (row.project_type ?? "residential") as ProjectType,
    price_starting: row.price_starting ? Number(row.price_starting) : null,
    price_max: row.price_max ? Number(row.price_max) : null,
    towers,
    amenities,
    construction_milestones: milestones,
  };
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data: projectRows, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !projectRows) return [];

  return projectRows.map((p) => mapProject(p, [], [], []));
}

export async function getProjectWithData(id: string): Promise<Project | null> {
  const supabase = createClient();

  const [projectRes, towersRes, flatsRes, amenitiesRes, milestonesRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("towers").select("*").eq("project_id", id).order("name"),
    supabase.from("flats").select("*").eq("project_id", id).order("floor").order("position_on_floor"),
    supabase
      .from("project_amenities")
      .select("amenity_id, amenities(id, name, icon, category)")
      .eq("project_id", id),
    supabase
      .from("construction_milestones")
      .select("*")
      .eq("project_id", id)
      .order("sort_order"),
  ]);

  if (projectRes.error || !projectRes.data) return null;

  const flats = (flatsRes.data ?? []).map(mapFlat);

  const towers: Tower[] = (towersRes.data ?? []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    name: t.name,
    total_floors: t.total_floors,
    flats_per_floor: t.flats_per_floor,
    flats: flats.filter((f) => f.tower_id === t.id || f.tower === t.name),
  }));

  // Flats not linked to any tower
  if (towers.length === 0 && flats.length > 0) {
    towers.push({
      id: "default",
      project_id: id,
      name: "Tower",
      total_floors: projectRes.data.total_floors ?? 1,
      flats_per_floor: projectRes.data.flats_per_floor ?? flats.length,
      flats,
    });
  }

  const amenities: Amenity[] = (amenitiesRes.data ?? [])
    .map((row: any) => row.amenities)
    .filter(Boolean) as Amenity[];

  const milestones: ConstructionMilestone[] = (milestonesRes.data ?? []).map((m) => ({
    id: m.id,
    project_id: m.project_id,
    title: m.title,
    description: m.description ?? null,
    target_date: m.target_date ?? null,
    completed_date: m.completed_date ?? null,
    is_completed: m.is_completed,
    photo_urls: m.photo_urls ?? null,
    sort_order: m.sort_order ?? null,
  }));

  return mapProject(projectRes.data, towers, amenities, milestones);
}

export async function getProjectsForAdmin(): Promise<Project[]> {
  const supabase = createClient();

  const [projectsRes, towersRes, flatsRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("towers").select("*").order("name"),
    supabase.from("flats").select("*").order("floor").order("position_on_floor"),
  ]);

  const projects = projectsRes.data ?? [];
  const towers = towersRes.data ?? [];
  const flats = (flatsRes.data ?? []).map(mapFlat);

  return projects.map((p) => {
    const projectTowers: Tower[] = towers
      .filter((t) => t.project_id === p.id)
      .map((t) => ({
        id: t.id,
        project_id: t.project_id,
        name: t.name,
        total_floors: t.total_floors,
        flats_per_floor: t.flats_per_floor,
        flats: flats.filter((f) => f.tower_id === t.id || (f.project_id === p.id && f.tower === t.name)),
      }));
    return mapProject(p, projectTowers, [], []);
  });
}

export type FlatWithProject = Flat & {
  projectId: string;
  projectName: string;
  projectCity: string;
  projectCover: string | null;
};

export async function getFlatsForSearch(opts: {
  types?: FlatType[];
  maxPrice?: number;
}): Promise<FlatWithProject[]> {
  const supabase = createClient();

  let query = supabase
    .from("flats")
    .select("*, projects(id, name, city, location, cover_image_url)")
    .eq("status", "available");

  if (opts.types && opts.types.length > 0) {
    query = query.in("flat_type", opts.types as unknown as readonly ("studio" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "penthouse")[]);
  }
  if (opts.maxPrice) {
    query = query.lte("total_price", opts.maxPrice);
  }

  const { data } = await query.order("total_price", { ascending: true });

  return (data ?? []).map((row: any) => ({
    ...mapFlat(row),
    projectId: row.projects?.id ?? row.project_id,
    projectName: row.projects?.name ?? "Unknown Project",
    projectCity: row.projects?.city ?? row.projects?.location ?? "",
    projectCover: row.projects?.cover_image_url ?? null,
  }));
}

export async function getProjectFlatStats(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("flats")
    .select("status")
    .eq("project_id", projectId);

  const stats = { total: 0, available: 0, sold: 0, reserved: 0, discussion: 0 };
  for (const f of data ?? []) {
    stats.total++;
    if (f.status === "available") stats.available++;
    else if (f.status === "sold") stats.sold++;
    else if (f.status === "reserved") stats.reserved++;
    else if (f.status === "discussion") stats.discussion++;
  }
  return stats;
}
