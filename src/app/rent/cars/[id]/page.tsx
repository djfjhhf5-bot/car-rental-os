"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import { OrderForm } from "@/components/public/order-form";

interface CarDetail {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  licensePlate: string;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  doors: number;
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
  depositAmount: number;
  mileageLimit: number | null;
  mileageUnit: string;
  status: string;
  location: string | null;
  description: string | null;
  imageUrl: string | null;
}

export default function CarDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const agency = searchParams.get("agency") || "demo";
  const { lang } = useLanguage();

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  async function loadCar() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/cars?agency=${agency}&id=${id}`);
      const json = await res.json();
      if (json.success) {
        setCar(json.data ?? null);
      } else {
        setError(json.error ?? "Car not found");
      }
    } catch {
      setError("Failed to load car details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCar();
  }, [id, agency]);

  if (loading) {
    return (
      <div className="w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop py-10">
        <Skeleton className="mb-6 h-6 w-32 bg-surface-container-high" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-xl bg-surface-container-high" />
            <Skeleton className="h-48 w-full rounded-xl bg-surface-container-high" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl bg-surface-container-high" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop py-20 text-center">
        <p className="font-manrope text-body-lg text-error mb-6">{error ?? "Car not found"}</p>
        <Link
          href={`/rent?agency=${agency}`}
          className="metallic-gradient text-on-primary-fixed font-manrope font-bold px-8 py-3 rounded hover:opacity-90 transition-opacity shadow-lg inline-block"
        >
          {t("car.backToListings", lang)}
        </Link>
      </div>
    );
  }

  const categoryLabel = car.category.charAt(0).toUpperCase() + car.category.slice(1);

  return (
    <div className="w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop py-10 animate-fade-in">
      <Link
        href={`/rent?agency=${agency}`}
        className="mb-6 inline-flex items-center gap-2 font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest hover:text-primary-fixed transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("car.backToListings", lang)}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative h-72 overflow-hidden rounded-xl bg-surface-container-high border border-outline-variant/30 ambient-shadow">
            {car.imageUrl ? (
              <Image
                src={car.imageUrl}
                alt={`${car.brand} ${car.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                    <span className="font-jetbrains-mono text-2xl font-bold text-primary">
                      {car.brand[0]}{car.model[0]}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <h1 className="font-montserrat text-headline-lg text-on-surface drop-shadow-lg">
                {car.brand} {car.model}
              </h1>
              <p className="font-manrope text-body-md text-on-surface-variant">{car.year}</p>
            </div>
            <div className="absolute right-4 top-4">
              <span className="font-jetbrains-mono text-label-sm text-primary bg-primary/10 border border-primary/50 px-3 py-1 rounded backdrop-blur-sm tracking-widest">
                {categoryLabel}
              </span>
            </div>
          </div>

          {car.description && (
            <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow">
              <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-3">{t("car.description", lang)}</h2>
              <p className="font-manrope text-body-md text-on-surface-variant leading-relaxed">{car.description}</p>
            </div>
          )}

          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow">
            <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-6">{t("car.specs", lang)}</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.transmission", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface capitalize">{car.transmission}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.fuelType", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface capitalize">{car.fuelType === "gasoline" ? "Petrol" : car.fuelType}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.seats", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface">{car.seats}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.year", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface">{car.year}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.doors", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface">{car.doors}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">{t("car.location", lang)}</p>
                <p className="font-manrope text-body-md text-on-surface">{car.location || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow sticky top-28">
            <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-6">{t("car.rates", lang)}</h2>
            <div className="text-center mb-6">
              <span className="font-montserrat text-display-md font-bold text-primary">{formatCurrency(car.dailyRate)}</span>
              <span className="font-manrope text-body-md text-on-surface-variant">{t("car.perDay", lang)}</span>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent my-4" />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.weekly", lang)}</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.weeklyRate ? formatCurrency(car.weeklyRate) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.monthly", lang)}</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.monthlyRate ? formatCurrency(car.monthlyRate) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.deposit", lang)}</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">{formatCurrency(car.depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.mileage", lang)}</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.mileageLimit ? `${car.mileageLimit.toLocaleString()} ${car.mileageUnit}` : "Unlimited"}
                </span>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent my-4" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.plate", lang)}</span>
                <span className="font-manrope text-body-md text-on-surface font-jetbrains-mono">{car.licensePlate}</span>
              </div>
              {car.color && (
                <div className="flex justify-between items-center">
                  <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">{t("car.color", lang)}</span>
                  <span className="font-manrope text-body-md text-on-surface capitalize">{car.color}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowOrder(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 metallic-gradient text-on-primary-fixed font-manrope font-bold px-6 py-3 rounded hover:opacity-90 transition-opacity shadow-lg"
            >
              {t("car.orderNow", lang)}
            </button>
          </div>
        </div>
      </div>

      {showOrder && car && (
        <OrderForm
          agency={agency}
          vehicleId={car.id}
          vehicleName={`${car.brand} ${car.model}`}
          carDetails={{
            brand: car.brand,
            model: car.model,
            year: car.year,
            transmission: car.transmission,
            fuelType: car.fuelType,
            seats: car.seats,
            dailyRate: car.dailyRate,
            category: car.category,
            imageUrl: car.imageUrl,
          }}
          onClose={() => setShowOrder(false)}
        />
      )}
    </div>
  );
}
