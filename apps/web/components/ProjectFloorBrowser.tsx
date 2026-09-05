"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Building, Floor, Unit } from "@/lib/types";
import { api } from "@/lib/api";
import UnitCard from "./UnitCard";

export default function ProjectFloorBrowser({
  buildings,
  buildingId: controlledId,
  onBuildingChange,
}: {
  buildings: Building[];
  buildingId?: string;
  onBuildingChange?: (id: string) => void;
}) {
  const t = useTranslations("project");
  const ct = useTranslations("common");
  const [internalId, setInternalId] = useState<string>(() => buildings[0]?.id ?? "");
  const buildingId = controlledId ?? internalId;
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorId, setFloorId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [floorUnits, setFloorUnits] = useState<Record<string, Unit[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const selectBuilding = (id: string) => {
    setInternalId(id);
    onBuildingChange?.(id);
  };

  const building = useMemo(
    () => buildings.find((b) => b.id === buildingId) ?? buildings[0],
    [buildings, buildingId],
  );

  useEffect(() => {
    if (!building) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setFloors([]);
    setFloorId("");
    setUnits([]);
    setFloorUnits({});
    api
      .floorsOf(building.id)
      .then(async (fs) => {
        if (cancelled) return;
        setFloors(fs);
        if (fs[0]) setFloorId(fs[0].id);
        const unitsByFloor = await Promise.all(
          fs.map(async (floor) => [floor.id, await api.unitsOnFloor(floor.id)] as const),
        );
        if (!cancelled) setFloorUnits(Object.fromEntries(unitsByFloor));
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [building?.id]);

  useEffect(() => {
    if (!floorId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .unitsOnFloor(floorId)
      .then((us) => !cancelled && setUnits(us))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [floorId]);

  if (buildings.length === 0) return null;

  const selectedFloor = floors.find((floor) => floor.id === floorId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <label htmlFor="building-selector" className="text-sm font-bold text-slate-700">{t("buildings")}</label>
        <select
          id="building-selector"
          value={building?.id}
          onChange={(e) => selectBuilding(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside aria-label={t("floors")} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("floors")}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {[...floors].sort((a, b) => b.number - a.number).map((floor) => {
              const floorData = floorUnits[floor.id] ?? [];
              const available = floorData.filter((unit) => unit.status === "available").length;
              const availability = floorData.length ? Math.round((available / floorData.length) * 100) : 0;
              const active = floor.id === floorId;
              return (
                <button
                  key={floor.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFloorId(floor.id)}
                  className={`min-w-36 rounded-xl border p-3 text-start transition lg:min-w-0 ${active ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white text-slate-800 hover:border-emerald-400"}`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-extrabold">
                    <span>{t("floor", { name: String(floor.number) })}</span>
                    <span className={active ? "text-emerald-300" : "text-emerald-700"}>{availability}%</span>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200/80" aria-hidden="true">
                    <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${availability}%` }} />
                  </span>
                  <span className={`mt-2 block text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                    {available}/{floorData.length || floor._count?.units || 0} {ct("unitsLabel")}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{building?.name}</p>
              <h3 className="text-2xl font-extrabold tracking-tight">
                {selectedFloor ? t("floor", { name: String(selectedFloor.number) }) : t("floors")}
              </h3>
            </div>
            {selectedFloor && <p className="text-sm text-slate-500">{units.length} {ct("unitsLabel")}</p>}
          </div>

          {loading && <p className="py-8 text-center text-slate-400">{ct("loading")}</p>}
          {error && <p className="py-8 text-center text-rose-600">{t("noUnits")}</p>}
          {!loading && !error && units.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">{t("noUnits")}</p>
          )}
          {!loading && !error && units.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {units.map((u) => <UnitCard key={u.id} unit={u} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
