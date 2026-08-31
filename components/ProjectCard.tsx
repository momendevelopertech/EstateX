import Link from "next/link";
import { formatEGP } from "@/lib/format";

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  starting_price: number | string | null;
  hero_image_url: string | null;
  available_units: number | string | null;
  status: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  "under construction": "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  "fully sold": "bg-red-100 text-red-800",
};

export default function ProjectCard({ project }: { project: ProjectRow }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.hero_image_url || "https://picsum.photos/seed/estatex/1600/900"}
          alt={project.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {project.status && (
          <span
            className={`absolute top-3 start-3 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[project.status] ?? "bg-slate-100 text-slate-700"}`}
          >
            {project.status}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {project.location || "Egypt"} · {project.available_units ? `${project.available_units} units available` : "Coming soon"}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Starting price</p>
            <p className="text-lg font-bold text-emerald-700">EGP {formatEGP(project.starting_price)}</p>
          </div>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-700">
            Explore Project →
          </span>
        </div>
      </div>
    </Link>
  );
}