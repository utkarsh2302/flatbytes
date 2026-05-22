import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BookingRow {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  agreement_value: number;
  booking_amount: number;
  status: string;
  booked_at: string;
  agreement_date: string | null;
  project_name: string;
  flat_number: string;
  flat_type: string;
  floor: number;
  broker_name: string | null;
  collected: number;
  pending: number;
}

export interface ScheduleRow {
  id: string;
  booking_id: string;
  milestone_label: string;
  due_date: string;
  amount: number;
  percentage: number;
  is_paid: boolean;
  paid_at: string | null;
  payment_mode: string | null;
  buyer_name: string;
  buyer_phone: string;
  flat_number: string;
  project_name: string;
}

export interface BrokerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  rera_id: string | null;
  commission_pct: number;
  tier: string;
  is_active: boolean;
  bookings_count: number;
  gross_value: number;
  commission: number;
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function getBookings(): Promise<BookingRow[]> {
  const supabase = createClient();
  const [bookingsRes, scheduleRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, buyer_name, buyer_phone, buyer_email, agreement_value, booking_amount,
        status, booked_at, agreement_date,
        projects ( name ),
        flats:flat_id ( flat_number, flat_type, floor ),
        brokers:broker_id ( name )
      `)
      .order("booked_at", { ascending: false }),
    supabase.from("payment_schedule").select("booking_id, amount, is_paid"),
  ]);

  const schedule = scheduleRes.data ?? [];
  const byBooking = new Map<string, { collected: number; pending: number }>();
  for (const s of schedule) {
    const e = byBooking.get(s.booking_id) ?? { collected: 0, pending: 0 };
    if (s.is_paid) e.collected += Number(s.amount);
    else e.pending += Number(s.amount);
    byBooking.set(s.booking_id, e);
  }

  return (bookingsRes.data ?? []).map((r: any) => {
    const money = byBooking.get(r.id) ?? { collected: 0, pending: 0 };
    return {
      id: r.id,
      buyer_name: r.buyer_name,
      buyer_phone: r.buyer_phone,
      buyer_email: r.buyer_email ?? null,
      agreement_value: Number(r.agreement_value),
      booking_amount: Number(r.booking_amount),
      status: r.status,
      booked_at: r.booked_at,
      agreement_date: r.agreement_date ?? null,
      project_name: r.projects?.name ?? "—",
      flat_number: r.flats?.flat_number ?? "—",
      flat_type: r.flats?.flat_type ?? "—",
      floor: r.flats?.floor ?? 0,
      broker_name: r.brokers?.name ?? null,
      collected: money.collected,
      pending: money.pending,
    };
  });
}

// ── Payment schedule ──────────────────────────────────────────────────────────
export async function getPaymentSchedule(): Promise<ScheduleRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payment_schedule")
    .select(`
      id, booking_id, milestone_label, due_date, amount, percentage,
      is_paid, paid_at, payment_mode,
      bookings:booking_id (
        buyer_name, buyer_phone,
        projects ( name ),
        flats:flat_id ( flat_number )
      )
    `)
    .order("due_date", { ascending: true });

  return (data ?? []).map((r: any) => ({
    id: r.id,
    booking_id: r.booking_id,
    milestone_label: r.milestone_label,
    due_date: r.due_date,
    amount: Number(r.amount),
    percentage: Number(r.percentage),
    is_paid: r.is_paid,
    paid_at: r.paid_at ?? null,
    payment_mode: r.payment_mode ?? null,
    buyer_name: r.bookings?.buyer_name ?? "—",
    buyer_phone: r.bookings?.buyer_phone ?? "—",
    flat_number: r.bookings?.flats?.flat_number ?? "—",
    project_name: r.bookings?.projects?.name ?? "—",
  }));
}

// ── Brokers ───────────────────────────────────────────────────────────────────
export async function getBrokersWithStats(): Promise<BrokerRow[]> {
  const supabase = createClient();
  const [brokersRes, bookingsRes] = await Promise.all([
    supabase.from("brokers").select("*").order("created_at"),
    supabase.from("bookings").select("broker_id, agreement_value, status"),
  ]);

  const bookings = bookingsRes.data ?? [];
  return (brokersRes.data ?? []).map((b: any) => {
    const own = bookings.filter((x) => x.broker_id === b.id && x.status !== "cancelled");
    const gross = own.reduce((s, x) => s + Number(x.agreement_value), 0);
    return {
      id: b.id,
      name: b.name,
      phone: b.phone,
      email: b.email ?? null,
      rera_id: b.rera_id ?? null,
      commission_pct: Number(b.commission_pct ?? 0),
      tier: b.tier ?? "free",
      is_active: b.is_active,
      bookings_count: own.length,
      gross_value: gross,
      commission: Math.round((gross * Number(b.commission_pct ?? 0)) / 100),
    };
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface Analytics {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  overdueAmount: number;
  overdueCount: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalLeads: number;
  conversionRate: number;
  flatsTotal: number;
  flatsSold: number;
  flatsAvailable: number;
  flatsReserved: number;
  revenueByMonth: { month: string; value: number }[];
  salesByProject: { name: string; sold: number; revenue: number }[];
  leadsBySource: { source: string; count: number }[];
  pipeline: { stage: string; count: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getAnalytics(): Promise<Analytics> {
  const supabase = createClient();
  const [bookingsRes, scheduleRes, leadsRes, flatsRes, projectsRes] = await Promise.all([
    supabase.from("bookings").select("id, agreement_value, status, booked_at, project_id"),
    supabase.from("payment_schedule").select("amount, is_paid, due_date, paid_at"),
    supabase.from("leads").select("id, source, status, stage"),
    supabase.from("flats").select("status"),
    supabase.from("projects").select("id, name"),
  ]);

  const bookings = bookingsRes.data ?? [];
  const schedule = scheduleRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const flats = flatsRes.data ?? [];
  const projects = projectsRes.data ?? [];

  const active = bookings.filter((b) => b.status !== "cancelled");
  const totalRevenue = active.reduce((s, b) => s + Number(b.agreement_value), 0);
  const collectedRevenue = schedule.filter((s) => s.is_paid).reduce((s, x) => s + Number(x.amount), 0);
  const pendingRevenue = schedule.filter((s) => !s.is_paid).reduce((s, x) => s + Number(x.amount), 0);

  const today = new Date();
  const overdue = schedule.filter((s) => !s.is_paid && s.due_date && new Date(s.due_date) < today);
  const overdueAmount = overdue.reduce((s, x) => s + Number(x.amount), 0);

  // revenue collected by month (last 8 months)
  const monthMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthMap.set(`${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, 0);
  }
  for (const s of schedule) {
    if (!s.is_paid || !s.paid_at) continue;
    const d = new Date(s.paid_at);
    const key = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    if (monthMap.has(key)) monthMap.set(key, monthMap.get(key)! + Number(s.amount));
  }
  const revenueByMonth = Array.from(monthMap.entries()).map(([month, value]) => ({ month, value }));

  // sales by project
  const projMap = new Map<string, { name: string; sold: number; revenue: number }>();
  for (const p of projects) projMap.set(p.id, { name: p.name, sold: 0, revenue: 0 });
  for (const b of active) {
    const e = projMap.get(b.project_id);
    if (e) { e.sold += 1; e.revenue += Number(b.agreement_value); }
  }
  const salesByProject = Array.from(projMap.values()).filter((p) => p.sold > 0).sort((a, b) => b.revenue - a.revenue);

  // leads by source
  const srcMap = new Map<string, number>();
  for (const l of leads) {
    const src = l.source ?? "website";
    srcMap.set(src, (srcMap.get(src) ?? 0) + 1);
  }
  const leadsBySource = Array.from(srcMap.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  // pipeline
  const stages = ["new", "contacted", "qualified", "site_visit", "negotiation", "won"];
  const pipeline = stages.map((stage) => ({
    stage,
    count: leads.filter((l) => (l.stage ?? l.status ?? "new") === stage).length,
  }));

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const bookingsThisMonth = active.filter((b) => b.booked_at && new Date(b.booked_at) >= monthStart).length;

  return {
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueAmount,
    overdueCount: overdue.length,
    totalBookings: active.length,
    bookingsThisMonth,
    totalLeads: leads.length,
    conversionRate: leads.length > 0 ? Math.round((active.length / leads.length) * 100) : 0,
    flatsTotal: flats.length,
    flatsSold: flats.filter((f) => f.status === "sold").length,
    flatsAvailable: flats.filter((f) => f.status === "available").length,
    flatsReserved: flats.filter((f) => f.status === "reserved").length,
    revenueByMonth,
    salesByProject,
    leadsBySource,
    pipeline,
  };
}

// ── Customer lookup (portal) ──────────────────────────────────────────────────
export interface CustomerData {
  booking: BookingRow;
  schedule: ScheduleRow[];
  receipts: { id: string; receipt_number: string; amount: number; payment_date: string; payment_mode: string }[];
}

export async function getCustomerByPhone(phone: string): Promise<CustomerData | null> {
  const supabase = createClient();
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (clean.length < 10) return null;

  // RLS-safe lookup via SECURITY DEFINER function (works for anonymous visitors)
  const { data: payload } = await (supabase.rpc as any)("get_customer_portal", { p_phone: clean });
  if (!payload || typeof payload !== "object") return null;

  const b: any = payload.booking;
  if (!b) return null;
  const sched: any[] = payload.schedule ?? [];
  const receiptRows: any[] = payload.receipts ?? [];

  const collected = sched.filter((s) => s.is_paid).reduce((s, x) => s + Number(x.amount), 0);
  const pending = sched.filter((s) => !s.is_paid).reduce((s, x) => s + Number(x.amount), 0);

  return {
    booking: {
      id: b.id,
      buyer_name: b.buyer_name,
      buyer_phone: b.buyer_phone,
      buyer_email: b.buyer_email ?? null,
      agreement_value: Number(b.agreement_value),
      booking_amount: Number(b.booking_amount),
      status: b.status,
      booked_at: b.booked_at,
      agreement_date: b.agreement_date ?? null,
      project_name: b.project_name ?? "—",
      flat_number: b.flat_number ?? "—",
      flat_type: b.flat_type ?? "—",
      floor: b.floor ?? 0,
      broker_name: b.broker_name ?? null,
      collected,
      pending,
    },
    schedule: sched.map((r: any) => ({
      id: r.id,
      booking_id: r.booking_id,
      milestone_label: r.milestone_label,
      due_date: r.due_date,
      amount: Number(r.amount),
      percentage: Number(r.percentage),
      is_paid: r.is_paid,
      paid_at: r.paid_at ?? null,
      payment_mode: r.payment_mode ?? null,
      buyer_name: b.buyer_name,
      buyer_phone: b.buyer_phone,
      flat_number: b.flat_number ?? "—",
      project_name: b.project_name ?? "—",
    })),
    receipts: receiptRows.map((r: any) => ({
      id: r.id,
      receipt_number: r.receipt_number,
      amount: Number(r.amount),
      payment_date: r.payment_date,
      payment_mode: r.payment_mode ?? "—",
    })),
  };
}
