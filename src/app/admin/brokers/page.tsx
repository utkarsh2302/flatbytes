import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { inrShort } from "@/lib/format";
import { Award, Users, IndianRupee, TrendingUp, Clock } from "lucide-react";
import AdminBrokersClient from "./AdminBrokersClient";

export const metadata: Metadata = { title: "Broker Management | Admin" };
export const revalidate = 30;

export default async function BrokersPage() {
  const supabase = createClient();

  const [brokersRes, bookingsRes, linksRes, projectsRes] = await Promise.all([
    supabase.from("brokers").select("*").order("created_at"),
    supabase.from("bookings").select("broker_id, agreement_value, status"),
    supabase.from("broker_links").select("broker_id, project_id, projects:project_id(id, name)"),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  const allBrokers = brokersRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const links = linksRes.data ?? [];
  const allProjects = (projectsRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name }));

  const pendingBrokers = allBrokers.filter((b) => !b.is_active).map((b) => ({
    id: b.id, name: b.name, phone: b.phone, email: b.email ?? null,
    rera_id: b.rera_id ?? null, created_at: b.created_at,
  }));

  const activeBrokers = allBrokers
    .filter((b) => b.is_active)
    .map((b) => {
      const own = bookings.filter((x) => x.broker_id === b.id && x.status !== "cancelled");
      const gross = own.reduce((s, x) => s + Number(x.agreement_value), 0);
      const assigned = links
        .filter((l) => l.broker_id === b.id)
        .map((l: any) => ({ id: l.projects?.id ?? l.project_id, name: l.projects?.name ?? "—" }))
        .filter((p) => p.id);
      return {
        id: b.id, name: b.name, phone: b.phone, email: b.email ?? null,
        rera_id: b.rera_id ?? null,
        commission_pct: Number(b.commission_pct ?? 2),
        tier: b.tier ?? "free",
        bookings_count: own.length,
        gross_value: gross,
        commission: Math.round((gross * Number(b.commission_pct ?? 2)) / 100),
        assigned_projects: assigned,
      };
    })
    .sort((a, b) => b.gross_value - a.gross_value);

  const totalCommission = activeBrokers.reduce((s, b) => s + b.commission, 0);
  const totalGross = activeBrokers.reduce((s, b) => s + b.gross_value, 0);
  const totalBookings = activeBrokers.reduce((s, b) => s + b.bookings_count, 0);

  const summary = [
    { label: "Active Partners", value: String(activeBrokers.length), icon: Users, accent: "#0071e3" },
    { label: "Sales via Brokers", value: inrShort(totalGross), icon: TrendingUp, accent: "#1cc77f" },
    { label: "Commission Payable", value: inrShort(totalCommission), icon: IndianRupee, accent: "#f59e0b" },
    { label: "Broker Bookings", value: String(totalBookings), icon: Award, accent: "#a855f7" },
    ...(pendingBrokers.length > 0 ? [{ label: "Pending Approval", value: String(pendingBrokers.length), icon: Clock, accent: "#ef4444" }] : []),
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Broker Management</h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Approve partners, assign projects, configure commissions, track performance.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.accent}14` }}>
                <Icon style={{ color: s.accent, width: 16, height: 16 }} />
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: s.label === "Pending Approval" ? "#ef4444" : "#1d1d1f" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <AdminBrokersClient pending={pendingBrokers} active={activeBrokers} allProjects={allProjects} />
    </div>
  );
}
