import { getBookings } from "@/lib/saas";
import BookingsView from "@/components/admin/BookingsView";

export const revalidate = 20;

export default async function BookingsPage() {
  const bookings = await getBookings();
  return <BookingsView bookings={bookings} />;
}
