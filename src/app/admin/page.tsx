import AdminDashboard from "@/components/admin/AdminDashboard";
import { getProjectsForAdmin } from "@/lib/data";
import { getDashboardStats } from "@/lib/leads";

export const revalidate = 30;

export default async function AdminPage() {
  const [projects, stats] = await Promise.all([
    getProjectsForAdmin(),
    getDashboardStats(),
  ]);

  return <AdminDashboard projects={projects} liveStats={stats} />;
}
