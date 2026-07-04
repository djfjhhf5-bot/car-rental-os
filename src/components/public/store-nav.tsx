"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";

export function StoreNav({ section }: { section: string }) {
  const { lang } = useLanguage();
  return <>{t(`nav.${section}`, lang)}</>;
}
