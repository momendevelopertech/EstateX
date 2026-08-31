import Link from "next/link";
import ProjectCard, { type ProjectRow } from "@/components/ProjectCard";
import { ensureSeeded } from "@/lib/seed";
import { sql } from "@/lib/db";
import { formatEGP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();

  const projects = (await sql`
    SELECT p.id, p.name, p.slug, p.description, p.location, p.starting_price, p.hero_image_url, p.status,
           (SELECT count(*)::int FROM units u
            JOIN floors f ON f.id = u.floor_id
            JOIN buildings b ON b.id = f.building_id
            WHERE b.project_id = p.id AND u.status = 'available') AS available_units
    FROM projects p
    ORDER BY p.launch_date DESC NULLS LAST
  `) as ProjectRow[];

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://picsum.photos/seed/azurehills/1920/900')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="mb-3 inline-block rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Discover → Explore → Compare → Decide
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Premium real estate, explored the way it should be.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Interactive masterplans, real-time availability, flexible payment plans and unit-level detail —
            everything a buyer, investor or agent needs to make a confident decision.
          </p>
          {projects[0] && (
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href={`/projects/${projects[0].slug}`}
                className="rounded-full bg-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
              >
                Explore {projects[0].name} →
              </Link>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Starting from</p>
                <p className="text-2xl font-extrabold text-emerald-300">
                  EGP {formatEGP(projects[0].starting_price)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Available projects</h2>
            <p className="mt-2 text-slate-500">Find your next home or investment opportunity.</p>
          </div>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No projects yet. Run <code className="rounded bg-slate-100 px-2 py-0.5">npm run seed</code> to load the demo dataset.
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