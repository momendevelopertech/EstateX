import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</main>
          <footer className="mt-20 border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-slate-500 sm:px-6">
              <span>{"EstateX"}</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}