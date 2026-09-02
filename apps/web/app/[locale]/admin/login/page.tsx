"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { setAdminSession } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const [email, setEmail] = useState("admin@estatex.com");
  const [password, setPassword] = useState("Admin@123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await api.login(email, password);
      setAdminSession({ token: res.accessToken, user: res.user });
      router.push("/admin/inventory");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-600">{t("email")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-600">{t("password")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </label>

          {error && <p className="text-sm font-semibold text-rose-600">{t("error")}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {busy ? "…" : t("submit")}
          </button>
        </form>
      </div>
    </section>
  );
}