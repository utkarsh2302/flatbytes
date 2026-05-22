import { getProjectsForAdmin } from "@/lib/data";
import InventoryView from "@/components/admin/InventoryView";

export const revalidate = 15;

export default async function InventoryPage() {
  const projects = await getProjectsForAdmin();
  return <InventoryView projects={projects} />;
}
