import { getPaymentSchedule } from "@/lib/saas";
import PaymentsView from "@/components/admin/PaymentsView";

export const revalidate = 20;

export default async function PaymentsPage() {
  const schedule = await getPaymentSchedule();
  return <PaymentsView schedule={schedule} />;
}
