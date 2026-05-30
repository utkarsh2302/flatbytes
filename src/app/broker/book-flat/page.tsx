import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile, getBrokerInventory } from "@/lib/broker";
import { DEMO_OPEN_ACCESS } from "@/lib/demo";
import { redirect } from "next/navigation";
import BookFlatClient from "./BookFlatClient";

export const metadata: Metadata = { title: "Book a Flat | Broker Portal" };
export const dynamic = "force-dynamic";

export default async function BookFlatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !DEMO_OPEN_ACCESS) redirect("/login?next=/broker/book-flat");
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) redirect("/broker/register");

  const inventory = await getBrokerInventory(profile.org_id);

  // eslint-disable-next-line
  const db = supabase as any;
  const { data: bookings } = await db
    .from("bookings")
    .select("id, buyer_name, buyer_phone, agreement_value, status, booked_at, flats:flat_id(flat_number), projects:project_id(name)")
    .eq("broker_id", profile.id)
    .order("booked_at", { ascending: false })
    .limit(8);

  const recent = (bookings ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    buyerName: b.buyer_name as string,
    buyerPhone: b.buyer_phone as string,
    agreementValue: Number(b.agreement_value),
    status: (b.status as string) ?? "booked",
    bookedAt: (b.booked_at as string) ?? "",
    flatNumber: (b.flats as { flat_number?: string } | null)?.flat_number ?? "—",
    projectName: (b.projects as { name?: string } | null)?.name ?? "—",
  }));

  return <BookFlatClient inventory={inventory} recent={recent} />;
}
