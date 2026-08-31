import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatEGP } from "@/lib/format";

export const dynamic = "force-dynamic";

interface BuildingSummary {
  id: string;
  name: string;
  floors_count: number;
  available: number;
  reserved: number;
  sold: number;
}

interface Platform {
  id: string;
  name: string;
  type: string | null;
  distance_minutes: number | string | null;
}

interface Amenity {
  id: string;
  name: string;
  icon: string | null;
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const projects = (await sql`
    SELECT p.*, d.name AS developer_name
    FROM projects p
    JOIN developers d ON d.id = p.developer_id
    WHERE p.slug = ${slug}
  `) as any[];

  const project = projects[0];
  if (!project) notFound();

  const buildings = (await sql`
    SELECT b.id, b.name, b.floors_count,
           count(*) FILTER (WHERE u.status = 'available') AS available,
           count(*) FILTER (WHERE u.status = 'reserved') AS reserved,
           count(*) FILTER (WHERE u.status = 'sold') AS sold
    FROM buildings b
    LEFT JOIN floors f ON f.building_id = b.id
    LEFT JOIN units u ON u.floor_id = f.id
    WHERE b.project_id = ${project.id}
    GROUP BY b.id
    ORDER BY b.name
  `) as BuildingSummary[];

  const pois = (await sql`
    SELECT * FROM location_pois WHERE project_id = ${project.id} ORDER BY distance_minutes
  `) as Platform[];

  const amenities = (await sql`
    SELECT * FROM amenities WHERE project_id = ${project.id}
  `) as Amenity[];

  const totalUnits = buildings.reduce((sum, b) => sum + b.available + b.reserved + b.sold, 0);
  const totalAvailable = buildings.reduce((sum, b) => sum + b.available, 0);

  const buildingStatusColor = (b: BuildingSummary): string => {
    if (b.sold > 0 && b.available === 0 && b.reserved === 0) return "bg-red-500";
    return "bg-emerald-500";
  };

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url('${project.hero_image_url || "https://picsum.photos/seed/azurehills/1920/900"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            {project.developer_name} · {project.status}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-6xl">{project.name}</h1>
          <p className="mt-3 text-lg text-slate-300">{project.location}</p>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Starting price</p>
              <p className="text-3xl font-extrabold text-emerald-300">EGP {formatEGP(project.starting_price)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Available units</p>
              <p className="text-3xl font-extrabold">{totalAvailable}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Reserved</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Sold</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="max-w-3xl text-lg leading-relaxed text-slate-600">{project.description}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight">Masterplan — Buildings</h2>
        <p className="mb-6 text-sm text-slate-500">
          {totalUnits} units across {buildings.length} buildings. Select a building to browse its floors. (Buildings marked <span className="font-semibold text-emerald-600">green</span> have units available.)
        </p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {buildings.map((b) => (
            <Link
              key={b.id}
              href={`/buildings/${b.id}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 ${buildingStatusColor(b)}`} />
              <p className="text-3xl font-extrabold text-slate-900">{b.name}</p>
              <p className="mt-1 text-xs text-slate-400">Building</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{b.floors_count} floor{b.floors_count > 1 ? "s" : ""}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  {b.available} available
                </span>
              </div>
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${(b.available / Math.max(1, totalUnits)) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(b.reserved / Math.max(1, totalUnits)) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(b.sold / Math.max(1, totalUnits)) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900 transition group-hover:text-emerald-700">
                Browse floors →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Location &amp; points of interest</h3>
          <div
            className="mb-4 h-52 w-full rounded-xl bg-slate-100"
            style={{
              backgroundImage:
                "url('https://picsum.photos/seed/azuresurroundings/900/420')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex h-full items-end justify-between bg-slate-900/0 p-4">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                📍 {project.name}
              </span>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {pois.map((poi) => (
              <li key={poi.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-700">{poi.name}</span>
                <span className="text-slate-400">{poi.distance_minutes} min · {poi.type}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Project amenities</h3>
          <div className="grid grid-cols-2 gap-3">
            {amenities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg">
                  {iconFor(a.icon)}
                </span>
                <span className="text-sm font-medium text-slate-700">{a.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-slate-900 p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Need help choosing?</p>
            <p className="mt-1 text-sm text-slate-300">
              Browse units, use the filters, or send an information request from any unit page and our sales team will reach out.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function iconFor(icon: string | null): string {
  const map: Record<string, string> = {
    pool: "🏊",
    gym: "🏋️",
    play: "🧒",
    park: "🌳",
    shield: "🛡️",
    home: "🏠",
  };
  return map[icon ?? ""] ?? "✨";
}