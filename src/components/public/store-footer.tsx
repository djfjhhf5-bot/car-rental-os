"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Car } from "lucide-react";
import { StoreNav } from "./store-nav";

export function StoreFooter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const agency = searchParams.get("agency") || "demo";
  const match = pathname.match(/^\/rent\/([^\/]+)/);
  const slug = match ? match[1] : null;
  const base = agency ? `/rent?agency=${agency}` : "/rent";

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#e94560");
  const [tagline, setTagline] = useState("The Pinnacle of Mobility");

  useEffect(() => {
    fetch(`/api/public/agency?slug=${agency}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setName(json.data.name);
          setLogo(json.data.logo);
          if (json.data.primaryColor) setPrimaryColor(json.data.primaryColor);
          setTagline(json.data.name ? `Rent ${json.data.name} Vehicles` : "The Pinnacle of Mobility");
        }
      })
      .catch(() => {});
  }, [agency]);

  return (
    <footer className="w-full mt-auto border-t border-outline-variant/30 bg-surface-container-lowest py-16 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max-width mx-auto">
      <div className="flex items-center gap-2.5 mb-4 md:mb-0">
        <Link href={base} className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a2e]">
              <Car className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="text-lg font-bold text-white">
            {name ? (
              <>
                {name.split(" ").slice(0, -1).join(" ")}{" "}
                <span style={{ color: primaryColor }}>{name.split(" ").pop()}</span>
              </>
            ) : (
              <>Premium<span style={{ color: primaryColor }}>Drive</span></>
            )}
          </span>
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-6 font-manrope text-body-md mb-4 md:mb-0">
        <Link href={base} className="text-on-surface-variant hover:text-primary transition-colors">
          <StoreNav section="home" />
        </Link>
        <Link href={base} className="text-on-surface-variant hover:text-primary transition-colors">
          <StoreNav section="fleet" />
        </Link>
        <Link href={base} className="text-primary hover:text-primary transition-colors">
          <StoreNav section="contact" />
        </Link>
      </div>
      <div className="text-on-surface-variant font-manrope text-body-md text-center md:text-right">
        &copy; {new Date().getFullYear()} {name || "Premium Drive"}. {tagline}.
      </div>
    </footer>
  );
}
