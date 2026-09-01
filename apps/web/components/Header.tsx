import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
          <img src="/logo.svg" alt="" className="h-7 w-7" />
          EstateX
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <Link href="/" className="rounded-full px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900">
            {t("home")}
          </Link>
          <Link href="/projects" className="rounded-full px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900">
            {t("projects")}
          </Link>
          <Link href="/favorites" className="rounded-full px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900">
            {t("favorites")}
          </Link>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}