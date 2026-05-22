import { getAnalytics } from "@/lib/saas";
import { inrShort } from "@/lib/format";
import { AreaChart, BarList, Donut, Funnel } from "@/components/admin/Charts";
import { TrendingUp, IndianRupee, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";

export const revalidate = 30;

const SOURCE_COLORS = ["#0071e3", "#1cc77f", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#ec4899"];

export default async function AnalyticsPage() {
  const a = await getAnalytics();

  const kpis = [
    { label: "Total Sales Value", value: inrShort(a.totalRevenue), icon: IndianRupee, accent: "#0071e3", sub: `${a.totalBookings} bookings` },
    { label: "Collected", value: inrShort(a.collectedRevenue), icon: TrendingUp, accent: "#1cc77f", sub: `${Math.round((a.collectedRevenue / (a.totalRevenue || 1)) * 100)}% of total` },
    { label: "Pending Dues", value: inrShort(a.pendingRevenue), icon: Clock, accent: "#f59e0b", sub: "across all schedules" },
    { label: "Overdue", value: inrShort(a.overdueAmount), icon: AlertTriangle, accent: "#ef4444", sub: `${a.overdueCount} installments` },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
          Analytics
        </h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Revenue, sales performance, and pipeline health across all projects.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.accent}14` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: k.accent, width: 18, height: 18 }} />
                </div>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.38)", marginTop: 4 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue trend + funnel */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Collections Trend</h2>
              <p style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.45)" }}>Payments received, last 8 months</p>
            </div>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(28,199,127,0.1)", color: "#059669", fontSize: "0.72rem", fontWeight: 600 }}>
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <AreaChart data={a.revenueByMonth} accent="#0071e3" />
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="mb-1" style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Sales Pipeline</h2>
          <p className="mb-4" style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.45)" }}>
            {a.totalLeads} leads · {a.conversionRate}% conversion
          </p>
          <Funnel stages={a.pipeline} />
        </div>
      </div>

      {/* Sales by project + lead sources + inventory */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Revenue by Project</h2>
          {a.salesByProject.length > 0 ? (
            <BarList
              items={a.salesByProject.map((p) => ({ label: p.name, value: p.revenue, sub: `${p.sold} sold` }))}
              accent="#0071e3"
              valueFormat="currency"
            />
          ) : (
            <p style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.4)" }}>No bookings yet.</p>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Lead Sources</h2>
          {a.leadsBySource.length > 0 ? (
            <Donut
              segments={a.leadsBySource.map((s, i) => ({
                label: s.source.replace(/_/g, " "),
                value: s.count,
                color: SOURCE_COLORS[i % SOURCE_COLORS.length],
              }))}
              centerLabel={String(a.totalLeads)}
              centerSub="leads"
            />
          ) : (
            <p style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.4)" }}>No leads yet.</p>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600, color: "#1d1d1f" }}>Inventory Status</h2>
          <Donut
            segments={[
              { label: "Available", value: a.flatsAvailable, color: "#1cc77f" },
              { label: "Sold", value: a.flatsSold, color: "#ef4444" },
              { label: "Reserved", value: a.flatsReserved, color: "#f59e0b" },
            ]}
            centerLabel={String(a.flatsTotal)}
            centerSub="units"
          />
        </div>
      </div>
    </div>
  );
}
