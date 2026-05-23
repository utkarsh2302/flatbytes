"use client";

import { useState, useMemo } from "react";

interface Props {
  commissionPct: number;
  brokerName: string;
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function calcEmi(principal: number, annualRate: number, tenureYears: number) {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const QUICK_PRICES = [
  { label: "₹50L", value: 5000000 },
  { label: "₹75L", value: 7500000 },
  { label: "₹1 Cr", value: 10000000 },
  { label: "₹1.5 Cr", value: 15000000 },
  { label: "₹2 Cr", value: 20000000 },
  { label: "₹3 Cr", value: 30000000 },
];

export default function BrokerCalculatorClient({ commissionPct, brokerName }: Props) {
  const [propertyPrice, setPropertyPrice] = useState(10000000);
  const [loanPct, setLoanPct] = useState(80);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [gstRate, setGstRate] = useState(5);

  const commission = useMemo(() => Math.round(propertyPrice * commissionPct / 100), [propertyPrice, commissionPct]);
  const gstOnCommission = useMemo(() => Math.round(commission * 18 / 100), [commission]);
  const tdsOnCommission = useMemo(() => Math.round(commission * 5 / 100), [commission]);
  const netCommission = useMemo(() => commission - tdsOnCommission, [commission, tdsOnCommission]);

  const gstOnProperty = useMemo(() => Math.round(propertyPrice * gstRate / 100), [propertyPrice, gstRate]);
  const totalCost = useMemo(() => propertyPrice + gstOnProperty + 350000 + Math.round(propertyPrice * 0.01), [propertyPrice, gstOnProperty]);

  const loanAmount = useMemo(() => Math.round(propertyPrice * loanPct / 100), [propertyPrice, loanPct]);
  const emi = useMemo(() => Math.round(calcEmi(loanAmount, rate, tenure)), [loanAmount, rate, tenure]);
  const totalPayable = useMemo(() => emi * tenure * 12, [emi, tenure]);
  const totalInterest = useMemo(() => totalPayable - loanAmount, [totalPayable, loanAmount]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Commission Calculator</h1>
        <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.48)", marginTop: 3 }}>
          Estimate your earnings at {commissionPct}% commission
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="rounded-2xl p-5 space-y-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>Property Value</h2>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {QUICK_PRICES.map((q) => (
              <button key={q.label} onClick={() => setPropertyPrice(q.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: propertyPrice === q.value ? "#0071e3" : "#f5f5f7", color: propertyPrice === q.value ? "#fff" : "rgba(0,0,0,0.6)", border: "none", cursor: "pointer" }}>
                {q.label}
              </button>
            ))}
          </div>

          {/* Custom price */}
          <div>
            <div className="flex justify-between mb-2">
              <span style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.55)" }}>Property Price</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d1d1f" }}>{fmt(propertyPrice)}</span>
            </div>
            <input type="range" min={1000000} max={100000000} step={500000} value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="w-full" style={{ accentColor: "#0071e3" }} />
          </div>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16 }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Home Loan EMI</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)" }}>
                  <span>Loan Amount</span><span style={{ fontWeight: 600, color: "#1d1d1f" }}>{loanPct}% · {fmt(loanAmount)}</span>
                </div>
                <input type="range" min={10} max={90} step={5} value={loanPct}
                  onChange={(e) => setLoanPct(Number(e.target.value))} className="w-full" style={{ accentColor: "#0071e3" }} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)" }}>
                  <span>Interest Rate</span><span style={{ fontWeight: 600, color: "#1d1d1f" }}>{rate}% p.a.</span>
                </div>
                <input type="range" min={6} max={14} step={0.25} value={rate}
                  onChange={(e) => setRate(Number(e.target.value))} className="w-full" style={{ accentColor: "#0071e3" }} />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)", marginBottom: 8 }}>Tenure</div>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((t) => (
                    <button key={t} onClick={() => setTenure(t)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: "none",
                        background: tenure === t ? "#0071e3" : "#f5f5f7",
                        color: tenure === t ? "#fff" : "#1d1d1f" }}>
                      {t}yr
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Commission breakdown */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#f59e0b 0%,#b45309 100%)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>YOUR COMMISSION @ {commissionPct}%</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{fmt(commission)}</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginTop: 4 }}>on {fmt(propertyPrice)} sale</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 12, paddingTop: 12 }}>
              <div className="flex justify-between" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>
                <span>Gross commission</span><span style={{ color: "#fff", fontWeight: 700 }}>{fmt(commission)}</span>
              </div>
              <div className="flex justify-between mt-2" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>
                <span>TDS deducted (5%)</span><span>−{fmt(tdsOnCommission)}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2" style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <span>You receive</span><span>{fmt(netCommission)}</span>
              </div>
            </div>
          </div>

          {/* EMI Summary */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Buyer EMI Summary</h3>
            <div className="space-y-2.5">
              {[
                { label: "Monthly EMI", value: fmt(emi), color: "#0071e3", big: true },
                { label: "Loan amount", value: fmt(loanAmount) },
                { label: "Total interest", value: fmt(totalInterest) },
                { label: "Total payable", value: fmt(totalPayable) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between" style={{ fontSize: row.big ? "0.95rem" : "0.8rem", fontWeight: row.big ? 700 : 400 }}>
                  <span style={{ color: "rgba(0,0,0,0.55)" }}>{row.label}</span>
                  <span style={{ color: row.color ?? "#1d1d1f", fontWeight: row.big ? 700 : 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total cost breakdown */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Total Cost to Buyer</h3>
            <div className="space-y-2.5">
              {[
                { label: "Property price", value: fmt(propertyPrice) },
                { label: `GST @ ${gstRate}%`, value: `+${fmt(gstOnProperty)}` },
                { label: "Stamp duty (~1%)", value: `+${fmt(Math.round(propertyPrice * 0.01))}` },
                { label: "Parking", value: "+₹3.5L (est.)" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between" style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.55)" }}>
                  <span>{row.label}</span>
                  <span style={{ color: "#1d1d1f", fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>
                <span>All-in cost</span>
                <span style={{ color: "#0071e3" }}>{fmt(totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
