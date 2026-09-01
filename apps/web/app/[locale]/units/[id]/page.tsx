import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatArea, formatPrice } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import FavoriteButton from "@/components/FavoriteButton";
import LeadForm from "@/components/LeadForm";
import InstallmentCalculator from "@/components/InstallmentCalculator";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("unit");
  const locale = await getLocale();

  let unit;
  let plans;
  try {
    unit = await api.getUnit(id);
    plans = await api.paymentPlansForUnit(id);
  } catch {
    notFound();
  }

  const project = unit.floor?.building?.project;
  const tour = unit.virtualTours?.[0];

  return (
    <section className="py-10">
      {project && (
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← {t("backToProject")}
        </Link>
      )}

      <div className="mt-4 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative flex h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950">
            <span className="absolute start-3 top-3">
              <StatusBadge status={unit.status} />
            </span>
            <span className="text-7xl font-black tracking-tight text-white/15">
              {unit.unitNumber}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("price")}</dt>
              <dd className="mt-1 font-extrabold text-emerald-700">
                {formatPrice(unit.price, locale)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("area")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{formatArea(unit.area, locale)}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("bedrooms")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{unit.unitType?.bedrooms ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("bathrooms")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{unit.unitType?.bathrooms ?? "—"}</dd>
            </div>
          </div>

          {tour && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold">{t("tours")} — {tour.name}</h2>
              {tour.scenes && tour.scenes.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {tour.scenes.map((s) => (
                    <div key={s.id} className="overflow-hidden rounded-xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.panoramaUrl} alt={s.roomName} className="h-32 w-full object-cover" />
                      <p className="px-3 py-2 text-xs font-semibold text-slate-600">
                        {s.roomName}
                        {s.areaSqm ? ` · ${formatArea(s.areaSqm, locale)}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {t("unitNo", { no: unit.unitNumber })}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {project?.name} · {unit.floor?.building?.name} · Floor {unit.floor?.number}
              </p>
            </div>
            <FavoriteButton unitId={unit.id} />
          </div>

          <InstallmentCalculator
            plans={plans}
            totalPrice={Number(unit.price)}
          />

          <LeadForm unitId={unit.id} />
        </div>
      </div>
    </section>
  );
}