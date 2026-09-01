"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CalcResult, PaymentPlan } from "@/lib/types";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function InstallmentCalculator({
  plans,
  totalPrice,
}: {
  plans: PaymentPlan[];
  totalPrice: number;
}) {
  const t = useTranslations("unit");
  const locale = useLocale();
  const [plan, setPlan] = useState<PaymentPlan | undefined>(plans[0]);
  const [down, setDown] = useState<number>();
  const [months, setMonths] = useState<number>();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState(false);

  const effectiveDown = down ?? plan?.downPaymentPercent ?? 20;
  const effectiveMonths = months ?? plan?.numberOfInstallments ?? 24;

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    setError(false);
    api
      .calculatePlan(plan.id, {
        downPaymentPercent: effectiveDown,
        months: effectiveMonths,
      })
      .then((r) => !cancelled && setResult(r))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [plan?.id, effectiveDown, effectiveMonths]);

  const derived = useMemo(() => {
    if (!plan || !totalPrice) return null;
    const downPayment = Math.round((totalPrice * effectiveDown) / 100);
    const financed = totalPrice - downPayment;
    const perInstallment = Math.round(financed / effectiveMonths);
    return { downPayment, financed, perInstallment };
  }, [plan, totalPrice, effectiveDown, effectiveMonths]);

  if (!plan) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-extrabold">{t("calculator")}</h3>
      <p className="mt-1 text-sm text-slate-500">{t("adjust")}</p>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-bold text-slate-600">{t("paymentPlan")}</span>
            <select
              value={plan.id}
              onChange={(e) => setPlan(plans.find((p) => p.id === e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-600">{t("downPayment")} (%)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={effectiveDown}
              onChange={(e) => setDown(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-600">{t("months", { count: effectiveMonths })}</span>
            <input
              type="number"
              min={1}
              max={120}
              value={effectiveMonths}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </label>
        </div>

        {error && <p className="text-sm text-rose-600">{t("error")}</p>}

        {derived && !error && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-emerald-600">{t("total")}</dt>
              <dd className="mt-1 font-extrabold text-emerald-800">{formatPrice(totalPrice, locale)}</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t("downPayment")}</dt>
              <dd className="mt-1 font-extrabold text-slate-900">{formatPrice(derived.downPayment, locale)}</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t("financed")}</dt>
              <dd className="mt-1 font-extrabold text-slate-900">{formatPrice(derived.financed, locale)}</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t("installment")}</dt>
              <dd className="mt-1 font-extrabold text-slate-900">{formatPrice(derived.perInstallment, locale)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}