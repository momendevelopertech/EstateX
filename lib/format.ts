export const formatEGP = (n: number | string | null | undefined): string => {
  const num = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
};