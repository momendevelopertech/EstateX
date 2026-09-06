"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function LeadForm({ unitId }: { unitId: string }) {
  const t = useTranslations("unit");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [scheduledAt, setScheduledAt] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await api.submitLead({ unitId, name, phone, email, contactMethod, scheduledAt: scheduledAt || undefined });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-800">
        {t("leadSuccess")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-extrabold">{t("leadTitle")}</h3>
      <div className="mt-4 space-y-3">
        <input
          required
          placeholder={t("leadName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        />
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-slate-700">{t("preferredContact")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {["whatsapp", "call", "email"].map((method) => (
              <label key={method} className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-bold capitalize ${contactMethod === method ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"}`}>
                <input className="sr-only" type="radio" name="contactMethod" value={method} checked={contactMethod === method} onChange={() => setContactMethod(method)} />
                {t(`contact.${method}` as never)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-bold text-slate-700">
          {t("viewingDate")}
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" />
        </label>
        <input
          placeholder={t("leadPhone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        />
        <input
          type="email"
          placeholder={t("leadEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-rose-600">{t("error")}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {t("leadSubmit")}
        </button>
      </div>
    </form>
  );
}
