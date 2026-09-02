"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export default function ProjectSearchForm({
  defaults,
}: {
  defaults: { name?: string; location?: string; priceMax?: string };
}) {
  const t = useTranslations("home");
  const pathname = usePathname();

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <form method="get" action={pathname} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="font-semibold text-slate-600">{t("searchName")}</span>
          <input name="name" defaultValue={defaults.name ?? ""} placeholder={t("searchName")} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-600">{t("searchLocation")}</span>
          <input name="location" defaultValue={defaults.location ?? ""} placeholder={t("searchLocation")} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-600">{t("searchPriceMax")}</span>
          <input name="priceMax" type="number" defaultValue={defaults.priceMax ?? ""} placeholder={t("searchPriceMax")} className={inputCls} />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          >
            {t("searchCta")}
          </button>
        </div>
      </div>
    </form>
  );
}