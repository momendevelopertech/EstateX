"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Building, Unit } from "@/lib/types";
import { api } from "@/lib/api";
import ProjectFloorBrowser from "./ProjectFloorBrowser";

const STATUS_COLORS: Record<string, string> = {
  available: "#10b981",
  reserved: "#f59e0b",
  sold: "#ef4444",
  hidden: "#94a3b8",
};

const STATUS_PRIORITY = ["hidden", "sold", "reserved", "available"] as const;

function dominant(units: Unit[]): string {
  for (const s of STATUS_PRIORITY) {
    if (units.some((u) => u.status === s)) return s;
  }
  return "none";
}

export default function MasterplanSection({ buildings }: { buildings: Building[] }) {
  const t = useTranslations("project");
  const statusT = useTranslations("unit.status");
  const [selectedId, setSelectedId] = useState<string>(() => buildings[0]?.id ?? "");
  const [unitsMap, setUnitsMap] = useState<Map<string, Map<number, Unit[]>>>(new Map());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const projectId = buildings[0]?.projectId;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api
      .unitsForProject(projectId)
      .then((list) => {
        if (cancelled) return;
        const map = new Map<string, Map<number, Unit[]>>();
        for (const u of list) {
          const bId = u.floor?.building?.id;
          const fNo = Number(u.floor?.number ?? 0);
          if (!bId) continue;
          if (!map.has(bId)) map.set(bId, new Map());
          const floors = map.get(bId)!;
          if (!floors.has(fNo)) floors.set(fNo, []);
          floors.get(fNo)!.push(u);
        }
        setUnitsMap(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const buildingStatus = useMemo(() => {
    const out = new Map<string, string>();
    for (const b of buildings) {
      const floors = unitsMap.get(b.id);
      const all = floors
        ? Array.from(floors.values()).reduce<Unit[]>((acc, us) => acc.concat(us), [])
        : [];
      out.set(b.id, dominant(all));
    }
    return out;
  }, [buildings, unitsMap]);

  if (buildings.length === 0) return null;

  const cols = Math.max(1, Math.ceil(Math.sqrt(buildings.length)));
  const cellW = 200;
  const rows = Math.ceil(buildings.length / cols);
  const vbW = cols * cellW + 60 * (cols + 1);
  const vbH = rows * 130 + 60 * (rows + 1);

  const zoomBy = (f: number) =>
    setScale((s) => Math.min(3, Math.max(1, Number((s * f).toFixed(2)))));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">{t("masterplan2d")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("selectBuilding")}</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => zoomBy(1.25)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-bold text-slate-700 hover:bg-slate-100"
              aria-label="+"
            >
              +
            </button>
            <span className="w-10 text-center text-xs font-semibold text-slate-500">
              {Math.round(scale * 100)}
            </span>
            <button
              onClick={() => zoomBy(0.8)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-bold text-slate-700 hover:bg-slate-100"
              aria-label="-"
            >
              −
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              ⟲
            </button>
          </div>
        </div>

        <div
          className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
          style={{ touchAction: "none" }}
          onWheel={(e) => {
            e.preventDefault();
            zoomBy(e.deltaY > 0 ? 0.85 : 1.15);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="w-full origin-top-left cursor-grab active:cursor-grabbing"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            {buildings.map((b, i) => {
              const row = Math.floor(i / cols);
              const col = i % cols;
              const x = 60 + col * (cellW + 60);
              const y = 60 + row * 130;
              const selected = b.id === selectedId;
              const floors = b._count?.floors ?? b.floorsCount ?? 1;
              const liveFloors = unitsMap.get(b.id) ?? new Map<number, Unit[]>();
              const status = buildingStatus.get(b.id) ?? "none";
              const fill = selected ? "#047857" : STATUS_COLORS[status] ?? "#e2e8f0";
              const floorH = 20;

              return (
                <g
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="cursor-pointer"
                  role="button"
                  aria-label={b.name}
                >
                  <rect
                    x={x}
                    y={y}
                    width={cellW}
                    height={Math.min(Math.max(floors, 1), 5) * floorH + 44}
                    rx={10}
                    fill={selected ? "#065f46" : fill}
                    stroke={selected ? "#047857" : "#cbd5e1"}
                    strokeWidth={selected ? 3 : 1.5}
                  />
                  {Array.from({ length: Math.min(Math.max(floors, 1), 5) }).map((_, f) => {
                    const fNo = f + 1;
                    const cells = liveFloors.get(fNo);
                    const cellStatus = cells ? dominant(cells) : "none";
                    return (
                      <rect
                        key={f}
                        x={x + 8}
                        y={y + 8 + f * floorH}
                        width={cellW - 16}
                        height={floorH - 4}
                        rx={3}
                        fill={selected ? "#10b981" : STATUS_COLORS[cellStatus] ?? "#e2e8f0"}
                      />
                    );
                  })}
                  <text
                    x={x + cellW / 2}
                    y={y + Math.min(Math.max(floors, 1), 5) * floorH + 28}
                    textAnchor="middle"
                    className={selected ? "fill-white font-bold" : "fill-slate-800 font-bold"}
                    style={{ fontSize: "15px" }}
                  >
                    {b.name}
                  </text>
                  <text
                    x={x + cellW / 2}
                    y={y + Math.min(Math.max(floors, 1), 5) * floorH + 42}
                    textAnchor="middle"
                    className={selected ? "fill-emerald-100" : "fill-slate-400"}
                    style={{ fontSize: "11px" }}
                  >
                    {floors} F
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          {(["available", "reserved", "sold", "hidden"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              {statusT(s)}
            </span>
          ))}
          <span className="text-slate-400">· {t("hintDragZoom")}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-extrabold tracking-tight">{t("buildings")}</h3>
        <div className="mt-4">
          <ProjectFloorBrowser
            buildings={buildings}
            buildingId={selectedId}
            onBuildingChange={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}