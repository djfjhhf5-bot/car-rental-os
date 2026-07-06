"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { StoreNav } from "./store-nav";

export function StoreInquireButton() {
  const pathname = usePathname();
  const match = pathname.match(/^\/rent\/([^\/]+)/);
  const slug = match ? match[1] : null;
  const href = slug ? `/rent/${slug}#fleet` : "/rent#fleet";

  return (
    <Link
      href={href}
      className="relative font-manrope font-bold px-4 py-1.5 rounded text-xs tracking-wider
        bg-white/10 backdrop-blur-xl border border-white/20
        text-white shadow-lg
        hover:bg-white/20 hover:border-white/30
        transition-all duration-300 ease-out
        before:absolute before:inset-0 before:rounded before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none
        overflow-hidden"
    >
      <span className="relative z-10"><StoreNav section="order" /></span>
    </Link>
  );
}
