import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Unit } from "@/lib/types";
import { formatArea, formatPrice } from "@/lib/format";
import StatusBadge from "./StatusBadge";

export default function UnitCard({ unit }: { unit: Unit }) {
  const locale = useLocale();
  const t = useTranslations("unit");
  const ct = useTranslations("common");
  const project = unit.floor?.building?.project;

  return (
    <Link
      href={`/units/${unit.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
        <span className="absolute start-3 top-3">
          <StatusBadge status={unit.status} />
        </span>
        <span className="px-4 text-center text-4xl font-black tracking-tight text-white/20 group-hover:text-white/40">
          {unit.unitNumber}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-slate-900">{t("unitNo", { no: unit.unitNumber })}</p>
            <p className="mt-0.5 text-xs text-slate-500">{unit.unitType?.name ?? ct("all")}</p>
          </div>
          <p className="text-sm font-extrabold text-emerald-700">
            {formatPrice(unit.price, locale)}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-100 px-1 py-2">
            <dt className="text-slate-500">{t("bedrooms")}</dt>
            <dd className="font-bold text-slate-900">{unit.unitType?.bedrooms ?? "—"}</dd>
          </div>
          <div className="rounded-lg bg-slate-100 px-1 py-2">
            <dt className="text-slate-500">{t("bathrooms")}</dt>
            <dd className="font-bold text-slate-900">{unit.unitType?.bathrooms ?? "—"}</dd>
          </div>
          <div className="rounded-lg bg-slate-100 px-1 py-2">
            <dt className="text-slate-500">{t("area")}</dt>
            <dd className="font-bold text-slate-900">{formatArea(unit.area, locale)}</dd>
          </div>
        </dl>

        {project?.name && (
          <p className="mt-auto truncate text-xs text-slate-500">
            {project.name} · {unit.floor?.building?.name} · {t("floor", { name: String(unit.floor?.number ?? "") })}
          </p>
        )}
      </div>
    </Link>
  );
}