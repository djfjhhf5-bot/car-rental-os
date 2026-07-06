"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { StoreNav } from "./store-nav";

export function StoreNavLinks() {
  const pathname = usePathname();
  const match = pathname.match(/^\/rent\/([^\/]+)/);
  const slug = match ? match[1] : null;
  const base = slug ? `/rent/${slug}` : "/rent";

  return (
    <div className="hidden md:flex items-center gap-8 font-manrope text-body-md uppercase tracking-widest">
      <Link
        href={base}
        className="text-primary font-bold border-b-2 border-primary pb-1"
      >
        <StoreNav section="fleet" />
      </Link>
    </div>
  );
}
