"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Unit } from "@/lib/types";
import UnitCard from "@/components/UnitCard";

interface Filters {
  bedrooms: string;
  status: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  balcony: boolean;
  terrace: boolean;
  parking: boolean;
  garden: boolean;
}

const DEFAULT_FILTERS: Filters = {
  bedrooms: "",
  status: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  balcony: false,
  terrace: false,
  parking: false,
  garden: false,
};

export default function UnitsPage() {
  const t = useTranslations("unitsPage");
  const ct = useTranslations("common");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await api.listUnits({
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
        status: filters.status || undefined,
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        areaMin: filters.areaMin ? Number(filters.areaMin) : undefined,
        balcony: filters.balcony ? "true" : undefined,
        terrace: filters.terrace ? "true" : undefined,
        parking: filters.parking ? "true" : undefined,
        garden: filters.garden ? "true" : undefined,
        limit: 200,
      });
      setUnits(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof Filters,>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => setFilters(DEFAULT_FILTERS);

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <section className="py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-slate-500">{t("subtitle")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                {t("filters")}
              </h2>
              <button
                onClick={reset}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                {t("reset")}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                <span className="font-semibold text-slate-600">{t("bedrooms")}</span>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => set("bedrooms", e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("any")}</option>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-slate-600">{t("status")}</span>
                <select
                  value={filters.status}
                  onChange={(e) => set("status", e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("any")}</option>
                  {["available", "reserved", "sold"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-sm font-semibold text-slate-600">{t("priceMax")}</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t("priceMin")}
                    value={filters.priceMin}
                    onChange={(e) => set("priceMin", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    placeholder={t("priceMax")}
                    value={filters.priceMax}
                    onChange={(e) => set("priceMax", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <label className="block text-sm">
                <span className="font-semibold text-slate-600">{t("areaMin")}</span>
                <input
                  type="number"
                  value={filters.areaMin}
                  onChange={(e) => set("areaMin", e.target.value)}
                  className={inputCls}
                />
              </label>

              <div>
                <span className="text-sm font-semibold text-slate-600">{t("amenities")}</span>
                <div className="mt-2 space-y-1.5 text-sm">
                  {(
                    [
                      ["balcony", t("balcony")],
                      ["terrace", t("terrace")],
                      ["parking", t("parking")],
                      ["garden", t("garden")],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters[key]}
                        onChange={(e) => set(key, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span className="text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <p className="mb-4 text-sm font-semibold text-slate-500">
            {t("results", { count: units.length })}
          </p>

          {loading && (
            <p className="py-16 text-center text-slate-400">{ct("loading")}</p>
          )}
          {!loading && error && (
            <p className="py-16 text-center text-rose-600">{ct("apiDown")}</p>
          )}
          {!loading && !error && units.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500">
              {t("noResults")}
            </p>
          )}
          {!loading && !error && units.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {units.map((u) => (
                <UnitCard key={u.id} unit={u} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}