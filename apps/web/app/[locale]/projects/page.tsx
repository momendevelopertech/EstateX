import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import ProjectSearchForm from "@/components/ProjectSearchForm";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; location?: string; priceMax?: string }>;
}) {
  const t = await getTranslations("home");
  const sp = await searchParams;
  const filters = {
    name: sp.name || undefined,
    location: sp.location || undefined,
    priceMax: sp.priceMax ? Number(sp.priceMax) || undefined : undefined,
  };

  let projects: Awaited<ReturnType<typeof api.listProjects>> | null = null;
  try {
    projects = await api.listProjects(filters);
  } catch {
    projects = [];
  }

  const hasFilters = Boolean(filters.name || filters.location || filters.priceMax);

  return (
    <section className="py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("projectsTitle")}</h1>
      <p className="mt-2 text-slate-500">{t("projectsSubtitle")}</p>

      <ProjectSearchForm
        defaults={{ name: sp.name, location: sp.location, priceMax: sp.priceMax }}
      />

      {projects.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          {hasFilters ? t("projectsNoResults") : t("projectsEmpty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}