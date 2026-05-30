import { getProjectsForAdmin } from "@/lib/data";
import InventoryHeatmap from "./InventoryHeatmap";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory Heatmap | Admin" };
export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const projects = await getProjectsForAdmin();
  return <InventoryHeatmap projects={projects} />;
}
