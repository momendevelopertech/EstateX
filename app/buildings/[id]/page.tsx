import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import { formatEGP } from "@/lib/format";

export const dynamic = "force-dynamic";

interface FloorWithUnits {
  floor_id: string;
  floor_number: number;
  unit_id: string;
  unit_number: string;
  area: number | string | null;
  price: number | string | null;
  status: string;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  view: string | null;
  image_url: string | null;
}

export default async function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const buildings = (await sql`
    SELECT b.id, b.name, b.floors_count, p.name AS project_name, p.slug AS project_slug
    FROM buildings b JOIN projects p ON p.id = b.project_id
    WHERE b.id = ${id}
  `) as any[];

  const building = buildings[0];
  if (!building) notFound();

  const floors = (await sql`
    SELECT f.id, f.number, f.plan_image_url,
           count(u.id)::int AS total_units,
           count(u.id) FILTER (WHERE u.status = 'available')::int AS available
    FROM floors f
    LEFT JOIN units u ON u.floor_id = f.id
    WHERE f.building_id = ${id}
    GROUP BY f.id
    ORDER BY f.number
  `) as any[];

  const units = (await sql`
    SELECT f.id AS floor_id, f.number AS floor_number,
           u.id AS unit_id, u.unit_number, u.area, u.price, u.status, u.view, u.image_url,
           ut.bedrooms, ut.bathrooms
    FROM units u
    JOIN floors f ON f.id = u.floor_id
    LEFT JOIN unit_types ut ON ut.id = u.unit_type_id
    WHERE f.building_id = ${id}
    ORDER BY f.number, u.unit_number
  `) as FloorWithUnits[];

  const byFloor = new Map<number, FloorWithUnits[]>();
  for (const u of units) {
    const list = byFloor.get(u.floor_number) ?? [];
    list.push(u);
    byFloor.set(u.floor_number, list);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${building.project_slug}`} className="hover:text-emerald-700">
          {building.project_name}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">Building {building.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Building {building.name}</h1>
          <p className="mt-1 text-slate-500">
            {building.floors_count} floor{building.floors_count > 1 ? "s" : ""} · select a floor to browse its units.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Reserved</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Sold</span>
        </div>
      </div>

      {/* Floor switcher */}
      <nav className="mt-4 flex flex-wrap gap-2">
        {floors.map((f) => (
          <a
            key={f.id}
            href={`#floor-${f.number}`}
            className="rounded-full border bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
          >
            {f.number === 0 ? "Ground" : f.number}
            <span className="ml-1.5 text-slate-400">({f.available} free)</span>
          </a>
        ))}
      </nav>

      {/* Floor sections */}
      {Array.from(byFloor.entries()).map(([floorNumber, list]) => {
        const available = list.filter((u) => u.status === "available").length;
        const total = list.length;
        return (
          <section key={floorNumber} id={`floor-${floorNumber}`} className="mt-10 scroll-mt-24">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold">
                {floorNumber === 0 ? "Ground floor" : `Floor ${floorNumber}`}
              </h2>
              <span className="text-sm font-semibold text-emerald-700">
                {available} of {total} available
              </span>
            </div>

            {/* Floor units grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((u) => (
                <Link
                  key={u.unit_id}
                  href={`/units/${u.unit_id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.image_url || "https://picsum.photos/seed/unit/800/500"}
                      alt={u.unit_number}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 start-2">
                      <StatusBadge status={u.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Unit {u.unit_number}</p>
                      <p className="font-bold text-emerald-700">EGP {formatEGP(u.price)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {u.bedrooms} bed · {u.bathrooms} bath · {formatEGP(u.area)} m²{u.view ? ` · ${u.view}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}