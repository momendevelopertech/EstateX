export function formatNumber(n: number | string | null | undefined, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));
}

export function formatPrice(
  n: number | string | null | undefined,
  locale = "en",
  currency = "EGP",
): string {
  const num = Number(n ?? 0);
  const formatted = formatNumber(num, locale);
  return locale === "ar"
    ? `${formatted} ${currency === "EGP" ? "ج.م" : currency}`
    : `${currency} ${formatted}`;
}

export function formatArea(
  n: number | string | null | undefined,
  locale = "en",
): string {
  const formatted = formatNumber(n, locale);
  return `${formatted} ${locale === "ar" ? "م²" : "m²"}`;
}

export function formatDate(date: string | Date | null | undefined, locale = "en"): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}