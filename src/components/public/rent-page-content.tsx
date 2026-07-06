"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Car } from "lucide-react";
import { CarCard } from "@/components/public/car-card";
import { FilterBar } from "@/components/public/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";

export interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRate: number;
  category: string;
  imageUrl?: string | null;
}

export function RentPageContent({ agency: agencyProp }: { agency?: string }) {
  const searchParams = useSearchParams();
  const agency = agencyProp || searchParams.get("agency") || "demo";
  const { lang } = useLanguage();
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCars() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/cars?agency=${agency}`);
      const json = await res.json();
      if (json.success) {
        setCars(json.data ?? []);
      } else {
        setError(json.error ?? t("fleet.loadError", lang));
      }
    } catch {
      setError(t("fleet.loadError", lang));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCars();
  }, [agency]);

  return (
    <>
      <section className="w-full max-w-[1000px] px-margin-mobile md:px-0 mx-auto mb-8">
        <Suspense fallback={<div className="glass-panel rounded-xl p-6 ambient-shadow"><Skeleton className="h-12 w-full" /></div>}>
          <FilterBar />
        </Suspense>
      </section>

      <section id="fleet" className="w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30">
                <Skeleton className="h-64 w-full rounded-none bg-surface-container-high" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4 bg-surface-container-high" />
                  <Skeleton className="h-4 w-1/2 bg-surface-container-high" />
                  <Skeleton className="h-10 w-full bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-error mb-6 font-manrope">{error}</p>
            <button
              onClick={fetchCars}
              className="metallic-gradient text-on-primary-fixed font-manrope font-bold px-8 py-3 rounded hover:opacity-90 transition-opacity shadow-lg"
            >
              {t("fleet.tryAgain", lang)}
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Car className="mb-4 h-12 w-12 text-outline/50" />
            <p className="font-montserrat text-headline-lg-mobile text-on-surface mb-2">{t("fleet.noCars", lang)}</p>
            <p className="font-manrope text-body-md text-on-surface-variant">{t("fleet.noCarsDesc", lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                brand={car.brand}
                model={car.model}
                year={car.year}
                transmission={car.transmission}
                fuelType={car.fuelType}
                seats={car.seats}
                dailyRate={car.dailyRate}
                category={car.category}
                imageUrl={car.imageUrl}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
