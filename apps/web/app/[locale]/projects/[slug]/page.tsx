import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import MasterplanSection from "@/components/MasterplanSection";
import ProjectMap from "@/components/ProjectMap";
import type { Building } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("project");
  const ct = await getTranslations("common");
  const locale = await getLocale();

  let project;
  try {
    project = await api.getProject(slug);
  } catch {
    notFound();
  }

  const buildings = (project.buildings ?? []) as Building[];

  return (
    <section className="py-10">
      <Link href="/projects" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← {ct("backToHome")}
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="relative flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-950">
            <span className="text-6xl font-black tracking-tight text-white/20">
              {project.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-extrabold tracking-tight">{project.name}</h1>
          <p className="mt-2 text-lg text-slate-500">{project.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("startingPrice")}</dt>
              <dd className="mt-1 font-extrabold text-emerald-700">
                {formatPrice(project.startingPrice, locale, project.baseCurrency)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("developer")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{project.developer?.name}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("launchDate")}</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatDate(project.launchDate, locale)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">{t("availableUnits")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{project.availableUnits ?? 0}</dd>
            </div>
          </dl>

          {project.amenities && project.amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t("amenities")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.amenities.map((a) => (
                  <span key={a.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {a.icon ? `${a.icon} ` : ""}
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-extrabold tracking-tight">{t("mapTitle")}</h2>
        <ProjectMap project={project} />
      </div>

      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight">{t("masterplan")}</h2>
        <MasterplanSection buildings={buildings} />
      </div>
    </section>
  );
}