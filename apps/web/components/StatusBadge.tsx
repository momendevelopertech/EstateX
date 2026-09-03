"use client";

import { useTranslations } from "next-intl";

const STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-red-100 text-red-800",
  hidden: "bg-slate-200 text-slate-600",
};

const ICONS: Record<string, { label: string; symbol: string }> = {
  available: { label: "Available", symbol: "✓" },
  reserved: { label: "Reserved", symbol: "◷" },
  sold: { label: "Sold", symbol: "×" },
  hidden: { label: "Hidden", symbol: "−" },
};

export default function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("unit.status");
  const cls = STYLES[status] ?? STYLES.hidden;
  const icon = ICONS[status] ?? ICONS.hidden;
  const label = t(status as never) || status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span aria-label={icon.label} className="flex h-3.5 w-3.5 items-center justify-center text-[11px] font-black leading-none" role="img">
        {icon.symbol}
      </span>
      {label}
    </span>
  );
}
