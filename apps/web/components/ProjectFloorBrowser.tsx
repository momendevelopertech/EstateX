"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Building, Floor, Unit } from "@/lib/types";
import { api } from "@/lib/api";
import UnitCard from "./UnitCard";

export default function ProjectFloorBrowser({ buildings }: { buildings: Building[] }) {
  const t = useTranslations("project");
  const ct = useTranslations("common");
  const [buildingId, setBuildingId] = useState<string>(() => buildings[0]?.id ?? "");
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorId, setFloorId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
    api
      .floorsOf(building.id)
      .then((fs) => {
        if (cancelled) return;
        setFloors(fs);
        if (fs[0]) setFloorId(fs[0].id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-slate-700">{t("buildings")}</label>
        <select
          value={building?.id}
          onChange={(e) => setBuildingId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {floors.length > 0 && (
          <>
            <label className="ms-3 text-sm font-bold text-slate-700">{t("floors")}</label>
            <select
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.number}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {loading && <p className="py-8 text-center text-slate-400">{ct("loading")}</p>}
      {error && <p className="py-8 text-center text-rose-600">{t("noUnits")}</p>}

      {!loading && !error && units.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          {t("noUnits")}
        </p>
      )}

      {!loading && !error && units.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {units.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      )}
    </div>
  );
}