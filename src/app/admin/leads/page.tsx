import { getLeadsForAdmin } from "@/lib/leads";
import LeadsInbox from "@/components/admin/LeadsInbox";

export const revalidate = 0;

export default async function AdminLeadsPage() {
  const leads = await getLeadsForAdmin();
  return <LeadsInbox leads={leads} />;
}
