import type { FlatStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import clsx from "clsx";

interface Props {
  status: FlatStatus;
  size?: "sm" | "md";
}

const statusClass: Record<FlatStatus, string> = {
  available: "status-available",
  sold: "status-sold",
  reserved: "status-reserved",
  held: "status-held",
  discussion: "status-discussion",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-pill font-normal whitespace-nowrap shrink-0",
        statusClass[status],
        size === "sm" ? "px-2 py-0.5 text-micro" : "px-2.5 py-1 text-caption"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {STATUS_LABELS[status]}
    </span>
  );
}
