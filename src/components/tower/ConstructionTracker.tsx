import type { ConstructionMilestone } from "@/lib/types";
import { CheckCircle, Clock, Circle } from "lucide-react";

interface Props {
  milestones: ConstructionMilestone[];
  overallPercentage: number;
}

export default function ConstructionTracker({ milestones, overallPercentage }: Props) {
  return (
    <div className="apple-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-tile" style={{ color: "#1d1d1f" }}>Construction Progress</h3>
        <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0071e3" }}>{overallPercentage}%</span>
      </div>

      {/* Overall bar */}
      <div
        className="h-1.5 rounded-pill overflow-hidden mb-7"
        style={{ background: "rgba(0,0,0,0.08)" }}
      >
        <div
          className="h-full rounded-pill"
          style={{ width: `${overallPercentage}%`, background: "#0071e3", transition: "width 0.7s ease" }}
        />
      </div>

      {/* Milestones */}
      <div className="relative">
        <div
          className="absolute left-[9px] top-0 bottom-0 w-px"
          style={{ background: "rgba(0,0,0,0.1)" }}
        />

        <div className="space-y-5">
          {milestones.map((m) => (
            <div key={m.id} className="relative flex items-start gap-4 pl-8">
              {/* Icon */}
              <div className="absolute left-0 top-0">
                {m.is_completed ? (
                  <CheckCircle className="w-5 h-5" style={{ color: "#34c759" }} />
                ) : m.completed_date == null && m.target_date ? (
                  <Clock className="w-5 h-5" style={{ color: "#0071e3" }} />
                ) : (
                  <Circle className="w-5 h-5" style={{ color: "rgba(0,0,0,0.2)" }} />
                )}
              </div>

              <div className="flex-1">
                <span
                  className="text-caption"
                  style={{
                    fontWeight: 500,
                    color: m.is_completed
                      ? "#1a7f4a"
                      : m.target_date
                      ? "#0071e3"
                      : "rgba(0,0,0,0.38)",
                  }}
                >
                  {m.title}
                </span>

                {m.description && (
                  <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.48)" }}>
                    {m.description}
                  </div>
                )}

                <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                  {m.is_completed && m.completed_date
                    ? `Completed ${formatDate(m.completed_date)}`
                    : m.target_date
                    ? `Target: ${formatDate(m.target_date)}`
                    : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
