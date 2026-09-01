import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const t = await getTranslations("home");
  let projects: Awaited<ReturnType<typeof api.listProjects>> | null = null;
  try {
    projects = await api.listProjects();
  } catch {
    projects = [];
  }

  return (
    <section className="py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("projectsTitle")}</h1>
      <p className="mt-2 text-slate-500">{t("projectsSubtitle")}</p>
      {projects.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          {t("projectsEmpty")}
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