"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StoreNav } from "./store-nav";

export function StoreNavLinks() {
  const searchParams = useSearchParams();
  const agency = searchParams.get("agency") || "demo";

  return (
    <div className="hidden md:flex items-center gap-8 font-manrope text-body-md uppercase tracking-widest">
      <Link
        href={`/rent?agency=${agency}`}
        className="text-primary font-bold border-b-2 border-primary pb-1"
      >
        <StoreNav section="fleet" />
      </Link>
    </div>
  );
}
