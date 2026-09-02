"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Building } from "@/lib/types";
import ProjectFloorBrowser from "./ProjectFloorBrowser";

export default function MasterplanSection({ buildings }: { buildings: Building[] }) {
  const t = useTranslations("project");
  const [selectedId, setSelectedId] = useState<string>(() => buildings[0]?.id ?? "");

  if (buildings.length === 0) return null;

  const cols = Math.max(1, Math.ceil(Math.sqrt(buildings.length)));
  const cellW = 220;
  const cellH = 150;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-lg font-extrabold tracking-tight">{t("masterplan2d")}</h3>
        <p className="mt-1 text-sm text-slate-500">{t("selectBuilding")}</p>

        <svg
          viewBox={`0 0 ${cols * cellW + 40 * (cols + 1)} ${Math.ceil(buildings.length / cols) * 120 + 40 * (Math.ceil(buildings.length / cols) + 1)}`}
          className="mt-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
        >
          {buildings.map((b, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = 40 + col * (cellW + 40);
            const y = 40 + row * 120;
            const selected = b.id === selectedId;
            const floors = b._count?.floors ?? b.floorsCount ?? 1;
            const floorH = 18;
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
                  height={Math.min(floors, 5) * floorH + 46}
                  rx={10}
                  fill={selected ? "#047857" : "#ffffff"}
                  stroke={selected ? "#047857" : "#cbd5e1"}
                  strokeWidth={selected ? 3 : 1.5}
                />
                {Array.from({ length: Math.min(floors, 5) }).map((_, f) => (
                  <rect
                    key={f}
                    x={x + 8}
                    y={y + 8 + f * floorH}
                    width={cellW - 16}
                    height={floorH - 4}
                    rx={3}
                    fill={selected ? "#10b981" : "#e2e8f0"}
                  />
                ))}
                <text
                  x={x + cellW / 2}
                  y={y + Math.min(floors, 5) * floorH + 30}
                  textAnchor="middle"
                  className={selected ? "fill-white font-bold" : "fill-slate-800 font-bold"}
                  style={{ fontSize: "16px" }}
                >
                  {b.name}
                </text>
                <text
                  x={x + cellW / 2}
                  y={y + Math.min(floors, 5) * floorH + 44}
                  textAnchor="middle"
                  className={selected ? "fill-emerald-100" : "fill-slate-400"}
                  style={{ fontSize: "12px" }}
                >
                  {floors} F
                </text>
              </g>
            );
          })}
        </svg>
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