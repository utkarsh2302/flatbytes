import { createClient } from "@/lib/supabase/server";
import RevenueCommandCentre from "./RevenueCommandCentre";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Revenue Command Centre | Admin" };
export const dynamic = "force-dynamic";

export interface RevenueStats {
  totalBookingValue: number;
  collected: number;
  outstanding: number;
  bookingsCount: number;
  avgBookingValue: number;
  cancelledValue: number;
  byMonth: { month: string; value: number; count: number }[];
  byProject: { name: string; value: number; count: number; collected: number }[];
  recentBookings: {
    id: string; buyer_name: string; flat_number: string; project_name: string;
    flat_type: string; agreement_value: number; collected: number; outstanding: number;
    status: string; booked_at: string; broker_name: string | null;
  }[];
  overdueCount: number;
  overdueAmount: number;
}

export default async function RevenuePage() {
  const supabase = createClient();

  const [bookingsRes, scheduleRes] = await Promise.all([
    supabase.from("bookings").select(`
      id, buyer_name, agreement_value, booking_amount, status, booked_at,
      projects ( name ),
      flats:flat_id ( flat_number, flat_type ),
      brokers:broker_id ( name )
    `).order("booked_at", { ascending: false }),
    supabase.from("payment_schedule").select("booking_id, amount, is_paid, due_date"),
  ]);

  const bookings = (bookingsRes.data ?? []) as any[];
  const schedule = (scheduleRes.data ?? []) as any[];

  // payment totals per booking
  const payMap = new Map<string, { collected: number; pending: number }>();
  const today = new Date().toISOString().split("T")[0];
  let overdueCount = 0, overdueAmount = 0;

  for (const s of schedule) {
    const e = payMap.get(s.booking_id) ?? { collected: 0, pending: 0 };
    if (s.is_paid) e.collected += Number(s.amount);
    else {
      e.pending += Number(s.amount);
      if (s.due_date < today) { overdueCount++; overdueAmount += Number(s.amount); }
    }
    payMap.set(s.booking_id, e);
  }

  const active = bookings.filter(b => b.status !== "cancelled");
  const totalBookingValue = active.reduce((s, b) => s + Number(b.agreement_value), 0);
  const collected = active.reduce((s, b) => s + (payMap.get(b.id)?.collected ?? 0), 0);
  const outstanding = active.reduce((s, b) => s + (payMap.get(b.id)?.pending ?? 0), 0);
  const cancelledValue = bookings.filter(b => b.status === "cancelled").reduce((s, b) => s + Number(b.agreement_value), 0);

  // monthly breakdown (last 8 months)
  const monthMap = new Map<string, { value: number; count: number }>();
  for (const b of active) {
    const key = b.booked_at?.slice(0, 7) ?? "unknown";
    const e = monthMap.get(key) ?? { value: 0, count: 0 };
    e.value += Number(b.agreement_value);
    e.count++;
    monthMap.set(key, e);
  }
  const byMonth = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([month, v]) => ({ month, ...v }));

  // by project
  const projMap = new Map<string, { value: number; count: number; collected: number }>();
  for (const b of active) {
    const name = b.projects?.name ?? "—";
    const e = projMap.get(name) ?? { value: 0, count: 0, collected: 0 };
    e.value += Number(b.agreement_value);
    e.count++;
    e.collected += payMap.get(b.id)?.collected ?? 0;
    projMap.set(name, e);
  }
  const byProject = Array.from(projMap.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .map(([name, v]) => ({ name, ...v }));

  const stats: RevenueStats = {
    totalBookingValue,
    collected,
    outstanding,
    bookingsCount: active.length,
    avgBookingValue: active.length > 0 ? Math.round(totalBookingValue / active.length) : 0,
    cancelledValue,
    byMonth,
    byProject,
    overdueCount,
    overdueAmount,
    recentBookings: bookings.slice(0, 15).map(b => ({
      id: b.id,
      buyer_name: b.buyer_name,
      flat_number: b.flats?.flat_number ?? "—",
      flat_type: b.flats?.flat_type ?? "—",
      project_name: b.projects?.name ?? "—",
      agreement_value: Number(b.agreement_value),
      collected: payMap.get(b.id)?.collected ?? 0,
      outstanding: payMap.get(b.id)?.pending ?? 0,
      status: b.status,
      booked_at: b.booked_at,
      broker_name: b.brokers?.name ?? null,
    })),
  };

  return <RevenueCommandCentre stats={stats} />;
}
