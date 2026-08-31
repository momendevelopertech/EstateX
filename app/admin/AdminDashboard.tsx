"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { formatEGP } from "@/lib/format";

interface UnitRow {
  id: string;
  unit_number: string;
  area: string | number | null;
  price: string | number | null;
  status: string;
  status_version: number;
  floor_number: number;
  building_name: string;
  project_name: string;
  type_name: string | null;
  new_leads: number | string | null;
}

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
  unit_number: string | null;
  project_name: string;
}

interface Counts {
  units: number;
  available: number;
  reserved: number;
  sold: number;
  leads: number;
  new_leads: number;
}

const STATUSES = ["available", "reserved", "sold", "hidden"];

export default function AdminDashboard({ email }: { email: string }) {
  const router = useRouter();
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [conflict, setConflict] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/units");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setUnits(data.units);
    setLeads(data.leads);
    setCounts(data.counts);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(unit: UnitRow, status: string) {
    setConflict(null);
    const res = await fetch(`/api/admin/units/${unit.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, expected_version: unit.status_version }),
    });
    if (res.status === 409) {
      const data = await res.json();
      setConflict(data); // refresh client state from server truth
      load();
      return;
    }
    if (res.ok) load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const filtered = filter === "all" ? units : units.filter((u) => u.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-slate-500">Signed in as <span className="font-medium text-slate-700">{email}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
          >
            View site ↗
          </a>
          <button
            onClick={logout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </div>

      {conflict && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">⚠️ Status conflict (HTTP 409)</p>
          <p className="mt-1">
            {conflict.message} Current state:{" "}
            <StatusBadge status={conflict.current?.status} /> (version {conflict.current?.statusVersion}). The list has been refreshed.
          </p>
        </div>
      )}

      {counts && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total units" value={counts.units} accent />
          <StatCard label="Available" value={counts.available} tone="emerald" />
          <StatCard label="Reserved" value={counts.reserved} tone="amber" />
          <StatCard label="Sold" value={counts.sold} tone="red" />
          <StatCard label="All leads" value={counts.leads} />
          <StatCard label="New leads" value={counts.new_leads} tone="emerald" />
        </div>
      )}

      <NewUnitForm onCreated={load} />

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Units inventory ({filtered.length})</h2>
          <div className="flex flex-wrap gap-2">
            {["all", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition ${
                  filter === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Building / Floor</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Price (EGP)</th>
                  <th className="px-4 py-3">New leads</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <a href={`/units/${u.id}`} target="_blank" className="font-bold text-slate-900 hover:text-emerald-700">
                        {u.unit_number}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.building_name} · {u.floor_number === 0 ? "G" : u.floor_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.type_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatEGP(u.area)} m²</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatEGP(u.price)}</td>
                    <td className="px-4 py-3">
                      {Number(u.new_leads) > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{u.new_leads}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status}
                        onChange={(e) => changeStatus(u, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold capitalize outline-none ${
                          u.status === "available"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : u.status === "reserved"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : u.status === "sold"
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Recent leads ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No leads yet — submit the form on a unit page to test it.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Interested in</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{new Date(l.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{l.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span>{l.phone}</span>
                      {l.email && <span className="block text-xs text-slate-400">{l.email}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.project_name}
                      {l.unit_number && <span className="block text-xs text-slate-400">Unit {l.unit_number}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold capitalize text-emerald-800">{l.status}</span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-slate-500">{l.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, tone, accent }: { label: string; value: number; tone?: string; accent?: boolean }) {
  const toneClass = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-700" : "text-slate-900";
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${accent ? "border-emerald-600 ring-1 ring-emerald-600" : "border-slate-200"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${toneClass}`}>{value}</p>
    </div>
  );
}

function NewUnitForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ floor_id: "", unit_number: "", unit_type_id: "", area: "", price: "" });
  const [buildings, setBuildings] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function openForm() {
    const [bRes, tRes] = await Promise.all([fetch("/api/admin/meta-buildings"), fetch("/api/admin/meta-unit-types")]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    setBuildings(bData.buildings ?? []);
    setTypes(tData.types ?? []);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: form.floor_id,
        unit_number: form.unit_number,
        unit_type_id: form.unit_type_id || null,
        area: form.area,
        price: form.price,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to create unit");
      return;
    }
    setForm({ floor_id: "", unit_number: "", unit_type_id: "", area: "", price: "" });
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button onClick={openForm} className="mt-6 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
        + Add unit
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Add a new unit</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          required
          value={form.floor_id}
          onChange={(e) => {
            setForm({ ...form, floor_id: e.target.value });
          }}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
        >
          <option value="">— Building / Floor —</option>
          {buildings.map((b) => (
            <optgroup key={b.id} label={b.name}>
              {b.floors.map((f: any) => (
                <option key={f.id} value={f.id}>{b.name} · {f.number === 0 ? "Ground" : `Floor ${f.number}`}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <input required placeholder="Unit number (e.g. A-01-05)" value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" />
        <select value={form.unit_type_id} onChange={(e) => setForm({ ...form, unit_type_id: e.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600">
          <option value="">— Unit type —</option>
          {types.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input required placeholder="Area (m²)" type="number" min={1} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" />
        <input required placeholder="Price (EGP)" type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" />
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" className="mt-4 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
        Create unit
      </button>
    </form>
  );
}