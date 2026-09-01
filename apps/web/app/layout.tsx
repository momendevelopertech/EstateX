import type { ReactNode } from "react";

/**
 * next-intl requires the root layout to exist; it only renders the children of the
 * real (locale-aware) layout defined under app/[locale]/layout.tsx. The /[locale]
 * segment renders <html>/<body> so `lang`/`dir` are correct per locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}