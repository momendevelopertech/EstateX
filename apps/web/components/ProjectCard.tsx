import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Project } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import StatusBadge from "./StatusBadge";

export default async function ProjectCard({ project }: { project: Project }) {
  const t = await getTranslations("project");
  const locale = await getLocale();

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-800 to-slate-950">
        {project.heroImageUrl ? (
          <img
            src={project.heroImageUrl}
            alt={`${project.name} hero`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-5xl font-black tracking-tight text-white/20 group-hover:text-white/40">
            {project.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <span className="absolute end-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-emerald-700">
          {project.availableUnits ?? 0} {t("availableUnits")}
        </span>
        <span className="absolute start-3 bottom-3">
          <StatusBadge status={project.status === "fully_sold" ? "sold" : "available"} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-extrabold text-slate-900">{project.name}</h3>
        <p className="line-clamp-2 text-sm text-slate-500">{project.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {t("startingPrice")}
          </span>
          <span className="font-mono font-extrabold tabular-nums text-emerald-700">
            {formatPrice(project.startingPrice, locale, project.baseCurrency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
