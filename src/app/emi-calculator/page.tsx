"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Calculator, TrendingDown, IndianRupee, ArrowLeft } from "lucide-react";

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function calcEmi(principal: number, rateYearly: number, tenureYears: number): number {
  const r = rateYearly / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function buildSchedule(principal: number, rateYearly: number, tenureYears: number) {
  const r = rateYearly / 12 / 100;
  const n = tenureYears * 12;
  const emi = calcEmi(principal, rateYearly, tenureYears);
  let balance = principal;
  const yearly: { year: number; principal: number; interest: number; balance: number }[] = [];

  for (let yr = 1; yr <= tenureYears; yr++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const intPart = balance * r;
      const prinPart = Math.min(emi - intPart, balance);
      yearInterest += intPart;
      yearPrincipal += prinPart;
      balance -= prinPart;
    }
    yearly.push({
      year: yr,
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      balance: Math.max(0, Math.round(balance)),
    });
    if (balance <= 0) break;
  }
  return yearly;
}

const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) => (
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.6)" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.12) ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.12) 100%)`,
        outline: "none",
      }}
    />
    <div className="flex justify-between mt-1.5" style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
      <span>{min >= 100000 ? formatINR(min) : min}</span>
      <span>{max >= 100000 ? formatINR(max) : max}</span>
    </div>
  </div>
);

export default function EmiCalculatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(7500000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const loanAmount = Math.round(propertyPrice * (1 - downPct / 100));
  const downPayment = propertyPrice - loanAmount;
  const emi = calcEmi(loanAmount, rate, tenure);
  const totalPayable = emi * tenure * 12;
  const totalInterest = totalPayable - loanAmount;
  const interestPct = ((totalInterest / loanAmount) * 100).toFixed(1);

  const schedule = useMemo(() => buildSchedule(loanAmount, rate, tenure), [loanAmount, rate, tenure]);

  // Donut chart via SVG
  const principalPct = (loanAmount / totalPayable) * 100;
  const interestPctDonut = 100 - principalPct;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const principalDash = (principalPct / 100) * circ;
  const interestDash = (interestPctDonut / 100) * circ;

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "rgba(0,0,0,0.08) 0px 2px 16px 0px",
    padding: "28px",
  };

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      <Navbar />
      <div className="pt-20 pb-16 px-4 max-w-6xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-micro mb-4"
            style={{ color: "#0071e3" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em", marginBottom: 6 }}>
            EMI Calculator
          </h1>
          <p style={{ fontSize: 15, color: "rgba(0,0,0,0.52)", maxWidth: 480 }}>
            Estimate your home loan EMI, total interest, and year-by-year repayment schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Left: Inputs ── */}
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5" style={{ color: "#0071e3" }} />
              <h2 style={{ fontWeight: 600, fontSize: 16, color: "#1d1d1f" }}>Loan Details</h2>
            </div>

            <SliderRow
              label="Property Price"
              value={propertyPrice}
              min={1000000}
              max={50000000}
              step={100000}
              display={formatINR(propertyPrice)}
              onChange={setPropertyPrice}
            />
            <SliderRow
              label="Down Payment"
              value={downPct}
              min={10}
              max={50}
              step={1}
              display={`${downPct}% — ${formatINR(downPayment)}`}
              onChange={setDownPct}
            />
            <SliderRow
              label="Interest Rate"
              value={rate}
              min={6}
              max={14}
              step={0.1}
              display={`${rate.toFixed(1)}% p.a.`}
              onChange={setRate}
            />
            <SliderRow
              label="Loan Tenure"
              value={tenure}
              min={5}
              max={30}
              step={1}
              display={`${tenure} years`}
              onChange={setTenure}
            />

            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: "Loan Amount", value: formatINR(loanAmount), accent: false },
                { label: "Down Payment", value: formatINR(downPayment), accent: false },
              ].map((c) => (
                <div key={c.label} className="rounded-standard p-3.5" style={{ background: "#f5f5f7" }}>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.42)", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.015em" }}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="flex flex-col gap-5">

            {/* EMI highlight */}
            <div
              style={{
                ...cardStyle,
                background: "#000",
                padding: "28px",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              {/* Donut */}
              <div className="shrink-0 relative" style={{ width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                  {/* Principal arc */}
                  <circle
                    cx="70" cy="70" r={r}
                    fill="none"
                    stroke="#0071e3"
                    strokeWidth="14"
                    strokeDasharray={`${principalDash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                  {/* Interest arc */}
                  <circle
                    cx="70" cy="70" r={r}
                    fill="none"
                    stroke="#ff9500"
                    strokeWidth="14"
                    strokeDasharray={`${interestDash} ${circ}`}
                    strokeDashoffset={-principalDash}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>monthly</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
                    ₹{(emi / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Monthly EMI</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.025em", marginBottom: 12 }}>
                  ₹{emi.toLocaleString("en-IN")}
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { dot: "#0071e3", label: "Principal", val: formatINR(loanAmount) },
                    { dot: "#ff9500", label: "Total Interest", val: formatINR(totalInterest) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginLeft: "auto" }}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Payable", value: formatINR(totalPayable), color: "#1d1d1f" },
                { label: "Total Interest", value: formatINR(totalInterest), color: "#c25000" },
                { label: "Interest Ratio", value: `${interestPct}%`, color: "#c25000" },
              ].map((s) => (
                <div key={s.label} className="text-center" style={{ ...cardStyle, padding: "18px 12px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Amortization table ── */}
        <div style={{ ...cardStyle, marginTop: 20, padding: 0, overflow: "hidden" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" style={{ color: "#0071e3" }} />
              <h2 style={{ fontWeight: 600, fontSize: 15, color: "#1d1d1f" }}>Year-by-Year Repayment</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f7" }}>
                  {["Year", "Principal Paid", "Interest Paid", "Total Paid", "Balance"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: h === "Year" ? "left" : "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "rgba(0,0,0,0.42)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr key={row.year} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
                      Yr {row.year}
                    </td>
                    {[
                      { val: formatINR(row.principal), color: "#0071e3" },
                      { val: formatINR(row.interest), color: "#c25000" },
                      { val: formatINR(row.principal + row.interest), color: "#1d1d1f" },
                      { val: row.balance > 0 ? formatINR(row.balance) : "Closed", color: row.balance === 0 ? "#1a7f4a" : "rgba(0,0,0,0.56)" },
                    ].map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "10px 20px",
                          textAlign: "right",
                          fontSize: 13,
                          color: cell.color,
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                          fontWeight: ci === 2 ? 500 : 400,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {cell.val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", textAlign: "center", marginTop: 16 }}>
          Estimates only. Actual EMI may vary based on lender fees, insurance, and credit profile.
        </p>
      </div>
    </div>
  );
}
