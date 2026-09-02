"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/admin-auth";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";

export default function AdminNotificationsPage() {
  const t = useTranslations("admin.notifications");
  const a = useTranslations("admin");
  const ct = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const session = useMemo(() => getAdminSession(), []);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      const res = await api.listNotifications(session.token);
      setItems(res.notifications);
      setUnread(res.unread);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        clearAdminSession();
        router.replace("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  }, [session, router]);

  useEffect(() => {
    if (!session?.token) {
      router.replace("/admin/login");
      return;
    }
    load();
  }, [session, router, load]);

  async function markRead(id: string, status: string) {
    if (!session?.token || status === "read") return;
    try {
      await api.markNotificationRead(session.token, id);
      setItems((list) => list.map((n) => (n.id === id ? { ...n, status: "sent" } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* keep state */
    }
  }

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-slate-500">{t("unread", { count: unread })}</p>
        </div>
        <button
          onClick={() => {
            clearAdminSession();
            router.replace("/admin/login");
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {a("signout")}
        </button>
      </div>

      {loading && <p className="py-12 text-center text-slate-400">{ct("loading")}</p>}

      {!loading && items.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          {t("empty")}
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {items.map((n) => {
            const read = n.status === "read";
            return (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border bg-white p-4 ${read ? "border-slate-200" : "border-emerald-200 ring-1 ring-emerald-100"}`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                    {!read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    )}
                    <span className="truncate capitalize">{String(n.type).replace(/_/g, " ")}</span>
                    {n.relatedEntityId && (
                      <span className="truncate font-mono text-xs text-slate-400">
                        {n.relatedEntityId.slice(0, 8)}
                      </span>
                    )}
                  </p>
                  {n.payload && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {JSON.stringify(n.payload)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {t("from", { time: formatDate(n.createdAt, locale) })}
                  </p>
                </div>
                {!read && (
                  <button
                    onClick={() => markRead(n.id, n.status)}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    {t("markRead")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}