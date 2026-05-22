import type { Tables } from "@/lib/supabase/database.types";

// Re-export raw DB row types
export type DBProject = Tables<"projects">;
export type DBTower = Tables<"towers">;
export type DBFlat = Tables<"flats">;
export type DBAmenity = Tables<"amenities">;
export type DBMilestone = Tables<"construction_milestones">;

// Enum types aligned with DB
export type FlatStatus = "available" | "sold" | "reserved" | "held" | "discussion";
export type FlatType = "studio" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "penthouse" | "office_suite" | "office_floor";
export type ProjectStatus = "active" | "upcoming" | "completed";
export type ProjectType = "residential" | "commercial" | "mixed_use";

// Flat — field names match DB columns exactly
export interface Flat {
  id: string;
  project_id: string;
  tower_id: string | null;
  tower: string;
  flat_number: string;
  floor: number;
  flat_type: FlatType;
  carpet_area_sqft: number;
  super_area_sqft: number | null;
  facing: string | null;
  price_per_sqft: number | null;
  total_price: number;
  floor_plan_url: string | null;
  view_360_url: string | null;
  status: FlatStatus;
  buyer_name: string | null;
  position_on_floor: number | null;
  bathrooms: number | null;
  balcony_count: number | null;
}

export interface Tower {
  id: string;
  project_id: string;
  name: string;
  total_floors: number;
  flats_per_floor: number;
  flats: Flat[];
}

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
}

export interface ConstructionMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_date: string | null;
  is_completed: boolean;
  photo_urls: string[] | null;
  sort_order: number | null;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  location: string;
  city: string | null;
  rera_number: string | null;
  description: string | null;
  cover_image_url: string | null;
  model_3d_url: string | null;
  total_towers: number | null;
  total_floors: number | null;
  flats_per_floor: number | null;
  possession_date: string | null;
  construction_stage: string | null;
  construction_percentage: number | null;
  status: ProjectStatus;
  project_type: ProjectType;
  price_starting: number | null;
  price_max: number | null;
  towers: Tower[];
  amenities: Amenity[];
  construction_milestones: ConstructionMilestone[];
}

export const FLAT_TYPE_LABELS: Record<FlatType, string> = {
  studio: "Studio",
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
  penthouse: "Penthouse",
  office_suite: "Office Suite",
  office_floor: "Full Floor",
};

// Legacy alias kept for any remaining imports
export const BHK_LABELS = FLAT_TYPE_LABELS;

export const STATUS_LABELS: Record<FlatStatus, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  held: "Held",
  discussion: "Under Discussion",
};

export const STATUS_COLORS: Record<FlatStatus, string> = {
  available: "#1cc77f",
  sold: "#ef4444",
  reserved: "#f97316",
  held: "#a855f7",
  discussion: "#3b82f6",
};

export function getProjectStats(project: Project) {
  let total = 0, available = 0, sold = 0, reserved = 0, discussion = 0;
  for (const tower of project.towers) {
    for (const flat of tower.flats) {
      total++;
      if (flat.status === "available") available++;
      else if (flat.status === "sold") sold++;
      else if (flat.status === "reserved") reserved++;
      else if (flat.status === "discussion") discussion++;
    }
  }
  return { total, available, sold, reserved, discussion };
}
