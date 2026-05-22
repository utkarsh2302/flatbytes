// Indian currency / number formatting helpers

export function inrShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  if (abs >= 1_000) return `₹${(n / 1_000).toFixed(0)} K`;
  return `₹${n.toFixed(0)}`;
}

export function inrFull(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function dateShort(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function dateMonth(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function relativeDays(d: string): number {
  return Math.round((new Date(d).getTime() - Date.now()) / 86400000);
}
