"use client";

import { useState } from "react";
import { computeInstallments, type InstallmentBreakdown } from "@/lib/installments";

export default function InstallmentCalculator({ price, plan }: { price: number; plan: InstallmentBreakdown }) {
  const [downPercent, setDownPercent] = useState(plan.downPaymentPercent);
  const [years, setYears] = useState(plan.frequencyLabel === "monthly" ? Math.max(1, Math.round(plan.numberOfInstallments / 12)) : 5);

  const effectiveInstallments = years * 12;
  const result = computeInstallments(price, downPercent, effectiveInstallments, "monthly");

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
      <p className="mb-4 text-sm font-semibold text-emerald-900">
        Adjust to your budget — your estimated payment updates instantly.
      </p>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
            <span>Down payment</span>
            <span className="font-bold text-emerald-700">{downPercent}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={downPercent}
            onChange={(e) => setDownPercent(Number(e.target.value))}
            className="w-full accent-emerald-700"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
            <span>Duration</span>
            <span className="font-bold text-emerald-700">{years} years ({effectiveInstallments} payments)</span>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-emerald-700"
          />
        </label>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Metric label="Down payment" value={result.downPaymentAmount} />
        <Metric label="Monthly (≈)" value={result.approximateMonthly} accent />
        <Metric label="Financed" value={result.financedAmount} />
      </div>
      {result.approximateMonthly > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Estimated <span className="font-semibold">EGP {result.approximateMonthly.toLocaleString("en-US")}</span> per month over {effectiveInstallments} equal monthly installments.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-3 shadow-sm ${accent ? "ring-2 ring-emerald-600" : ""}`}>
      <p className={`text-base font-extrabold ${accent ? "text-emerald-700" : "text-slate-900"}`}>
        EGP {value.toLocaleString("en-US")}
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}