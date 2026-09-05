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
  const backArrow = locale === "ar" ? "→" : "←";

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

  const waPhone = (process.env.NEXT_PUBLIC_SALES_WHATSAPP ?? "201000000000").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `${t("unitNo", { no: unit.unitNumber })}${project?.name ? ` — ${project.name}` : ""} — ${formatPrice(unit.price, locale)}`,
  );
  const waHref = `https://wa.me/${waPhone}?text=${waMessage}`;

  const features: Array<[string, boolean]> = [
    [t("balcony"), Boolean(unit.hasBalcony)],
    [t("terrace"), Boolean(unit.hasTerrace)],
    [t("parking"), Number(unit.parkingSpots) > 0],
    [t("storage"), Boolean(unit.hasStorage)],
    [t("garden"), Boolean(unit.hasGarden)],
  ];

  return (
    <section className="py-10">
      {project && (
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          {backArrow} {t("backToProject")}
        </Link>
      )}

      <div className="mt-4 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950">
            {tour?.scenes?.[0]?.panoramaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tour.scenes[0].panoramaUrl} alt={tour.scenes[0].roomName} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
            <span className="absolute start-3 top-3">
              <StatusBadge status={unit.status} />
            </span>
            {!tour?.scenes?.[0]?.panoramaUrl && <span className="relative text-7xl font-black tracking-tight text-white/15">
              {unit.unitNumber}
            </span>}
          </div>

          {tour?.scenes && tour.scenes.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label={t("tourScenes")}>
              {tour.scenes.map((scene) => (
                <a key={scene.id} href={`#scene-${scene.id}`} className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene.panoramaUrl} alt={scene.roomName} className="h-16 w-24 object-cover" />
                </a>
              ))}
            </div>
          )}

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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {t("features")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {features.map(([label, active]) => (
                <span
                  key={label}
                  className={`rounded-full px-3 py-1 font-semibold ${
                    active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {label}
                </span>
              ))}
              {unit.view && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                  {t("view")}: {unit.view}
                </span>
              )}
              {unit.orientation && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                  {t("orientation")}: {unit.orientation}
                </span>
              )}
            </div>
          </div>

          {tour && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold">{t("tours")} — {tour.name}</h2>
              {tour.scenes && tour.scenes.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {tour.scenes.map((s) => (
                    <div id={`scene-${s.id}`} key={s.id} className="overflow-hidden rounded-xl border border-slate-200">
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

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4 0-.5.2-.7l.4-.5c.1-.2.2-.3.3-.5v-.5c0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7a11 11 0 0 0 4.2 3.6c.6.3 1 .4 1.4.6.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.2-.2Z" />
            </svg>
            {t("whatsapp")}
          </a>

          <LeadForm unitId={unit.id} />
        </div>
      </div>
    </section>
  );
}
