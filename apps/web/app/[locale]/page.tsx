import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("hero");
  const ht = await getTranslations("home");

  let projects: Awaited<ReturnType<typeof api.listProjects>> | null = null;
  try {
    projects = await api.listProjects();
  } catch {
    projects = [];
  }

  const heroProject = projects[0];

  return (
    <>
      <section className="relative -mx-4 overflow-hidden bg-slate-900 text-white sm:-mx-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://picsum.photos/seed/azurehills/1920/900')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="mb-3 inline-block rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            {t("badge")}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">{t("subtitle")}</p>
          {heroProject && (
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href={`/projects/${heroProject.slug}`}
                className="rounded-full bg-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
              >
                {t("cta", { project: heroProject.name })}
              </Link>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t("startingFrom")}
                </p>
                <p className="text-2xl font-extrabold text-emerald-300">
                  {formatPrice(heroProject.startingPrice, locale)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">{ht("projectsTitle")}</h2>
          <p className="mt-2 text-slate-500">{ht("projectsSubtitle")}</p>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {ht("projectsEmpty")}
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}