"use client";

import { useState } from "react";

export default function LeadForm({ projectId, unitId, unitNumber }: { projectId: string; unitId?: string | null; unitNumber?: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          unit_id: unitId,
          unit_number: unitNumber,
          source: "unit_page",
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-bold text-emerald-800">Request received!</p>
        <p className="mt-1 text-sm text-emerald-700">
          Our sales team will contact you shortly with full details about this unit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input required placeholder="Full name" value={form.name} onChange={set("name")}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        <input required placeholder="Phone / WhatsApp" value={form.phone} onChange={set("phone")}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      </div>
      <input placeholder="Email (optional)" type="email" value={form.email} onChange={set("email")}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      <textarea placeholder="Message (optional)" value={form.message} onChange={set("message")} rows={3}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      {state === "error" && <p className="text-sm font-medium text-red-600">Something went wrong. Please try again.</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {state === "sending" ? "Sending..." : "Request Information / Book a Viewing"}
      </button>
    </form>
  );
}