"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Favorite } from "@/lib/types";
import { api } from "@/lib/api";
import { ensureGuestSessionId, getGuestSessionId } from "@/lib/guest";
import UnitCard from "@/components/UnitCard";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const ct = useTranslations("common");
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const guest = await ensureGuestSessionId();
      const favorites = await api.listFavorites(guest);
      setItems(favorites);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(fav: Favorite) {
    const guest = getGuestSessionId();
    try {
      await api.removeFavorite(fav.id, guest ?? undefined);
      setItems((prev) => prev.filter((f) => f.id !== fav.id));
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>

      {loading && <p className="mt-8 text-slate-400">{ct("loading")}</p>}
      {error && !loading && <p className="mt-8 text-rose-600">{t("notSignedIn")}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          {t("empty")}
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((fav) => (
            <div key={fav.id} className="relative">
              <UnitCard unit={fav.unit} />
              <button
                type="button"
                onClick={() => remove(fav)}
                className="absolute end-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50"
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}