"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const search = searchParams.get("search") || "";

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/rent?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams(searchParams.toString());
    const searchVal = formData.get("search") as string;
    if (searchVal) {
      params.set("search", searchVal);
    } else {
      params.delete("search");
    }
    router.push(`/rent?${params.toString()}`);
  }

  const hasFilters = category !== "all" || minPrice || maxPrice || search;

  return (
    <div className="glass-panel rounded-xl p-6 ambient-shadow">
      <form className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3 flex flex-col gap-2">
          <label className="font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest">
            Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => applyFilter("category", e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded p-3 appearance-none input-focus-gold transition-colors font-manrope text-body-md"
            >
              <option value="all">All Categories</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="sports">Sports</option>
              <option value="luxury">Luxury</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="electric">Electric</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest">
            Min Price
          </label>
          <input
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("minPrice", e.target.value);
              } else {
                params.delete("minPrice");
              }
              router.push(`/rent?${params.toString()}`);
            }}
            className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded p-3 input-focus-gold transition-colors font-manrope text-body-md placeholder:text-on-surface-variant/50"
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest">
            Max Price
          </label>
          <input
            type="number"
            placeholder="$500"
            value={maxPrice}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("maxPrice", e.target.value);
              } else {
                params.delete("maxPrice");
              }
              router.push(`/rent?${params.toString()}`);
            }}
            className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded p-3 input-focus-gold transition-colors font-manrope text-body-md placeholder:text-on-surface-variant/50"
          />
        </div>
        <div className="md:col-span-4 flex flex-col gap-2">
          <label className="font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest">
            Search
          </label>
          <input
            name="search"
            defaultValue={search}
            placeholder="Brand or model..."
            className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded p-3 input-focus-gold transition-colors font-manrope text-body-md placeholder:text-on-surface-variant/50"
          />
        </div>
        <div className="md:col-span-1 h-[50px]">
          <button
            type="submit"
            onClick={handleSearchSubmit}
            className="w-full h-full metallic-gradient flex items-center justify-center rounded text-on-primary-fixed hover:opacity-90 transition-opacity shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </form>
      {hasFilters && (
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/rent")}
            className="font-jetbrains-mono text-label-sm text-primary hover:text-primary-fixed transition-colors uppercase tracking-widest"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
