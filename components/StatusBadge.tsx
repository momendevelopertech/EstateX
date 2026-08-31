const STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-red-100 text-red-800",
  hidden: "bg-slate-200 text-slate-600",
};

const DOTS: Record<string, string> = {
  available: "bg-emerald-500",
  reserved: "bg-amber-500",
  sold: "bg-red-500",
  hidden: "bg-slate-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? STYLES.hidden;
  const dot = DOTS[status] ?? DOTS.hidden;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {status}
    </span>
  );
}