"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ApiClientError, api } from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/admin-auth";
import { formatArea, formatPrice } from "@/lib/format";
import type { Building, Floor, Project, Unit } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

const STATUSES = ["available", "reserved", "sold", "hidden"];

interface Conflict {
  unitId: string;
  unitNumber: string;
  status: string;
}

export default function AdminInventoryPage() {
  const t = useTranslations("admin.inventory");
  const a = useTranslations("admin");
  const ct = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [flashes, setFlashes] = useState<Array<{ id: number; text: string }>>([]);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [creating, setCreating] = useState(false);

  const session = useMemo(() => getAdminSession(), []);

  const flash = (text: string) => {
    const id = Date.now();
    setFlashes((f) => [...f, { id, text }]);
    setTimeout(() => setFlashes((f) => f.filter((x) => x.id !== id)), 3500);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listUnits({ limit: 200, hidden: "true" });
      setUnits(list);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        clearAdminSession();
        router.replace("/admin/login");
        return;
      }
      flash(ct("apiDown"));
    } finally {
      setLoading(false);
    }
  }, [router, ct]);

  useEffect(() => {
    if (!session?.token) {
      router.replace("/admin/login");
      return;
    }
    refresh();
  }, [session, router, refresh]);

  async function changeStatus(unit: Unit, status: string) {
    const token = session?.token;
    if (!token || status === unit.status) return;
    try {
      await api.changeUnitStatus(token, unit.id, status, unit.statusVersion);
      await refresh();
      flash(t("saved"));
    } catch (e) {
      if (e instanceof ApiClientError && e.details?.error === "UNIT_STATUS_CONFLICT") {
        setConflict({
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          status: e.details?.current?.status ?? unit.status,
        });
        await refresh();
      } else {
        flash(t("error"));
      }
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? units.filter((u) => {
          const hay = `${u.unitNumber} ${u.floor?.building?.name ?? ""} ${u.floor?.number ?? ""} ${u.unitType?.name ?? ""} ${u.floor?.building?.project?.name ?? ""}`.toLowerCase();
          return hay.includes(q);
        })
      : units;
  }, [units, query]);

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  function signOut() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-slate-500">{t("subtitle")}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {a("signout")}
        </button>
      </div>

      {flashes.length > 0 && (
        <div className="mt-4 space-y-2">
          {flashes.map((f) => (
            <p key={f.id} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              {f.text}
            </p>
          ))}
        </div>
      )}

      {conflict && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
        >
          <p className="font-bold text-amber-800">{t("statusConflictTitle")}</p>
          <p className="mt-0.5 text-amber-900">
            {t("statusConflict", { status: conflict.status })} {conflict.unitNumber}
          </p>
          <button
            onClick={() => setConflict(null)}
            className="mt-2 text-xs font-bold text-amber-800 underline"
          >
            OK
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className={`${inputCls} max-w-xs`}
        />
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
        >
          + {t("addUnit")}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-start text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 text-start">{t("columns.unit")}</th>
              <th className="px-4 py-3 text-start">{t("columns.location")}</th>
              <th className="px-4 py-3 text-start">{t("columns.type")}</th>
              <th className="px-4 py-3 text-start">{t("columns.area")}</th>
              <th className="px-4 py-3 text-start">{t("columns.price")}</th>
              <th className="px-4 py-3 text-start">{t("columns.status")}</th>
              <th className="px-4 py-3 text-end"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-bold text-slate-900">{u.unitNumber}</td>
                <td className="px-4 py-3 text-slate-600">
                  {u.floor?.building?.project?.name ?? "—"} · {u.floor?.building?.name ?? "—"} · {u.floor?.number ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.unitType?.name ? `${u.unitType.name} (${u.unitType.bedrooms})` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatArea(u.area, locale)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatPrice(u.price, locale)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={u.status} />
                    <select
                      value={u.status}
                      onChange={(e) => changeStatus(u, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-end">
                  <button
                    onClick={() => setEditing(u)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    {t("edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-slate-500">{t("empty")}</p>
        )}
        {loading && <p className="p-8 text-center text-slate-400">{ct("loading")}</p>}
      </div>

      {creating && <CreateUnitModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refresh(); }} />}
      {editing && <EditUnitModal unit={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </section>
  );
}

function CreateUnitModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("admin.inventory");
  const ct = useTranslations("common");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [floors, setFloors] = useState<Floor[]>([]);
  const [form, setForm] = useState({ floorId: "", unitNumber: "", area: "", price: "", status: "available" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    setBuildings([]);
    setBuildingId("");
    setFloors([]);
    setForm((f) => ({ ...f, floorId: "" }));
    if (!projectId) return;
    api.getProject(projectId).then((p) => setBuildings(p.buildings ?? [])).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    setFloors([]);
    setForm((f) => ({ ...f, floorId: "" }));
    if (!buildingId) return;
    api.floorsOf(buildingId).then(setFloors).catch(() => {});
  }, [buildingId]);

  async function submit() {
    if (!form.floorId || !form.unitNumber) return;
    setBusy(true);
    try {
      const token = getAdminSession()?.token;
      if (!token) return;
      await api.createUnit(token, {
        floorId: form.floorId,
        unitNumber: form.unitNumber,
        area: Number(form.area),
        price: Number(form.price),
        status: form.status,
      });
      onCreated();
    } catch {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-extrabold">{t("create")}</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <label className="block">
          <span className="font-semibold text-slate-600">{t("project")}</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">{t("placeholders.selectProject")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-semibold text-slate-600">{t("building")}</span>
          <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={inputCls}>
            <option value="">{t("placeholders.selectBuilding")}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        {floors.length > 0 && (
          <label className="block">
            <span className="font-semibold text-slate-600">{t("floor")}</span>
            <select value={form.floorId} onChange={(e) => setForm((f) => ({ ...f, floorId: e.target.value }))} className={inputCls}>
              <option value="">{t("placeholders.selectFloor")}</option>
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>{fl.number}</option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="font-semibold text-slate-600">{t("columns.unit")}</span>
          <input value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} placeholder={t("placeholders.unitNumber")} className={inputCls} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-semibold text-slate-600">{t("columns.area")}</span>
            <input type="number" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder={t("placeholders.area")} className={inputCls} />
          </label>
          <label className="block">
            <span className="font-semibold text-slate-600">{t("columns.price")}</span>
            <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder={t("placeholders.price")} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="font-semibold text-slate-600">{t("placeholders.status")}</span>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{ct("reset")}</button>
        <button onClick={submit} disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {busy ? "…" : t("create")}
        </button>
      </div>
    </Modal>
  );
}

function EditUnitModal({
  unit,
  onClose,
  onSaved,
}: {
  unit: Unit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("admin.inventory");
  const ct = useTranslations("common");
  const [form, setForm] = useState({
    price: String(unit.price ?? ""),
    area: String(unit.area ?? ""),
    view: unit.view ?? "",
    orientation: unit.orientation ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const token = getAdminSession()?.token;
      if (!token) return;
      await api.updateUnit(token, unit.id, {
        price: form.price ? Number(form.price) : undefined,
        area: form.area ? Number(form.area) : undefined,
        view: form.view || null,
        orientation: form.orientation || null,
      });
      onSaved();
    } catch {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-extrabold">
        {t("edit")} · {unit.unitNumber}
      </h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-semibold text-slate-600">{t("columns.price")}</span>
            <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputCls} />
          </label>
          <label className="block">
            <span className="font-semibold text-slate-600">{t("columns.area")}</span>
            <input type="number" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="font-semibold text-slate-600">View</span>
          <input value={form.view} onChange={(e) => setForm((f) => ({ ...f, view: e.target.value }))} className={inputCls} />
        </label>
        <label className="block">
          <span className="font-semibold text-slate-600">Orientation</span>
          <input value={form.orientation} onChange={(e) => setForm((f) => ({ ...f, orientation: e.target.value }))} className={inputCls} />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{ct("reset")}</button>
        <button onClick={submit} disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {busy ? "…" : ct("apply")}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}