"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { ensureGuestSessionId, getGuestSessionId } from "@/lib/guest";

export default function FavoriteButton({ unitId }: { unitId: string }) {
  const t = useTranslations("unit");
  const ft = useTranslations("favorites");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setBusy(true);
    setError(false);
    try {
      if (active) {
        const guest = getGuestSessionId();
        const favorites = await api.listFavorites(guest ?? undefined);
        const mine = favorites.find((f) => f.unitId === unitId);
        if (mine) await api.removeFavorite(mine.id, guest ?? undefined);
        setActive(false);
      } else {
        const guest = await ensureGuestSessionId();
        await api.addFavorite(unitId, guest);
        setActive(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
          active
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
        } disabled:opacity-60`}
      >
        <span aria-hidden>{active ? "♥" : "♡"}</span>
        {active ? t("unfavorite") : t("favorite")}
      </button>
      {error && <span className="text-xs text-rose-600">{ft("notSignedIn")}</span>}
    </div>
  );
}