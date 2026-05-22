import Navbar from "@/components/layout/Navbar";
import PortalLookup from "./PortalLookup";

export const metadata = { title: "Customer Portal — FlatBytes" };

export default function PortalPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      <Navbar />
      <div className="pt-24 pb-24 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Customer Portal
            </p>
            <h1 className="mt-2" style={{ fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
              Track your home journey
            </h1>
            <p className="mt-2" style={{ fontSize: "0.95rem", color: "rgba(0,0,0,0.55)" }}>
              View your payment schedule, download receipts, and follow construction progress.
            </p>
          </div>
          <PortalLookup />
        </div>
      </div>
    </div>
  );
}
