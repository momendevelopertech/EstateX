"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/types";

export default function ProjectMap({ project }: { project: Project }) {
  const t = useTranslations("project");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const lat = Number(project.latitude);
    const lng = Number(project.longitude);
    const el = containerRef.current;
    if (!el || Number.isNaN(lat) || Number.isNaN(lng)) return;

    let cancelled = false;
    let map: any = null;

    (async () => {
      const mod: any = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelled) return;
      map = L.map(el, {
        center: [lat, lng],
        zoom: 13,
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const markerIcon = L.divIcon({
        html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-emerald-600 shadow"></div>',
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const points: Array<{ id: string; name: string; category: string; lat: number; lng: number }> = [
        { id: project.id, name: project.name, category: "project", lat, lng },
        ...(project.pois ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category ?? "poi",
          lat: lat + (Math.random() - 0.5) * 0.012,
          lng: lng + (Math.random() - 0.5) * 0.012,
        })),
      ];

      points.forEach((p) => {
        const m = L.marker([p.lat, p.lng], { icon: markerIcon }).addTo(map);
        m.bindPopup(
          `<strong>${p.name}</strong>${
            p.category && p.category !== "project"
              ? `<br/><span class="opacity-60">${p.category}</span>`
              : ""
          }`,
        );
      });
      if (points[1]) {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [mounted, project]);

  if (!mounted) return <div className="h-72 rounded-2xl bg-slate-100" />;

  const lat = Number(project.latitude);
  const lng = Number(project.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {t("mapNoData")}
      </p>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-2xl border border-slate-200" />
      {project.pois && project.pois.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {project.pois.map((p) => (
            <li
              key={p.id}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {p.name}
              {p.distanceMinutes ? ` · ${p.distanceMinutes} min` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}