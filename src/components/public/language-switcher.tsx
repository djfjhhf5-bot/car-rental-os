"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { t, type Lang } from "@/lib/i18n/translations";
import { Globe } from "lucide-react";

const LANGS: { value: Lang; flag: string }[] = [
  { value: "en", flag: "🇬🇧" },
  { value: "fr", flag: "🇫🇷" },
  { value: "ar", flag: "🇸🇦" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 text-on-surface-variant" />
      {LANGS.map((l) => (
        <button
          key={l.value}
          onClick={() => setLang(l.value)}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
            lang === l.value
              ? "bg-primary text-white font-bold"
              : "text-on-surface-variant hover:text-primary"
          }`}
          title={t(`lang.${l.value}`, lang)}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
