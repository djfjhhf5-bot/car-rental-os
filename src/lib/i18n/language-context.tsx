"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Lang } from "./translations";
import { LANG_DIR } from "./translations";

type LanguageContextType = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    const dir = LANG_DIR[newLang];
    document.documentElement.dir = dir;
    document.documentElement.lang = newLang;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, dir: LANG_DIR[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
