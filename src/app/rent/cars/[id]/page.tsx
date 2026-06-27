"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

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
  const id = params.id as string;

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCar() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/cars?agency=demo&id=${id}`);
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
  }, [id]);

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
          href="/rent"
          className="metallic-gradient text-on-primary-fixed font-manrope font-bold px-8 py-3 rounded hover:opacity-90 transition-opacity shadow-lg inline-block"
        >
          Browse Cars
        </Link>
      </div>
    );
  }

  const categoryLabel = car.category.charAt(0).toUpperCase() + car.category.slice(1);
  const whatsappMessage = encodeURIComponent(
    `Hi Premium Drive! I'm interested in renting the ${car.brand} ${car.model} (${car.year}). Can you provide more details?`
  );

  return (
    <div className="w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop py-10 animate-fade-in">
      <Link
        href="/rent"
        className="mb-6 inline-flex items-center gap-2 font-jetbrains-mono text-label-sm text-primary uppercase tracking-widest hover:text-primary-fixed transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to listings
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative h-72 overflow-hidden rounded-xl bg-surface-container-high border border-outline-variant/30 ambient-shadow">
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                  <span className="font-jetbrains-mono text-2xl font-bold text-primary">
                    {car.brand[0]}{car.model[0]}
                  </span>
                </div>
              </div>
            </div>
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
              <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-3">Description</h2>
              <p className="font-manrope text-body-md text-on-surface-variant leading-relaxed">{car.description}</p>
            </div>
          )}

          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow">
            <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-6">Specifications</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Transmission</p>
                <p className="font-manrope text-body-md text-on-surface capitalize">{car.transmission}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Fuel Type</p>
                <p className="font-manrope text-body-md text-on-surface capitalize">{car.fuelType === "gasoline" ? "Petrol" : car.fuelType}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Seats</p>
                <p className="font-manrope text-body-md text-on-surface">{car.seats}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Year</p>
                <p className="font-manrope text-body-md text-on-surface">{car.year}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Doors</p>
                <p className="font-manrope text-body-md text-on-surface">{car.doors}</p>
              </div>
              <div>
                <p className="font-jetbrains-mono text-label-sm text-primary tracking-widest uppercase mb-1">Location</p>
                <p className="font-manrope text-body-md text-on-surface">{car.location || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow sticky top-28">
            <h2 className="font-montserrat text-headline-lg-mobile text-on-surface mb-6">Pricing</h2>
            <div className="text-center mb-6">
              <span className="font-montserrat text-display-md font-bold text-primary">{formatCurrency(car.dailyRate)}</span>
              <span className="font-manrope text-body-md text-on-surface-variant">/day</span>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent my-4" />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Weekly</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.weeklyRate ? formatCurrency(car.weeklyRate) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Monthly</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.monthlyRate ? formatCurrency(car.monthlyRate) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Deposit</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">{formatCurrency(car.depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Mileage</span>
                <span className="font-manrope text-body-md text-on-surface font-semibold">
                  {car.mileageLimit ? `${car.mileageLimit.toLocaleString()} ${car.mileageUnit}` : "Unlimited"}
                </span>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent my-4" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Plate</span>
                <span className="font-manrope text-body-md text-on-surface font-jetbrains-mono">{car.licensePlate}</span>
              </div>
              {car.color && (
                <div className="flex justify-between items-center">
                  <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Color</span>
                  <span className="font-manrope text-body-md text-on-surface capitalize">{car.color}</span>
                </div>
              )}
            </div>
            <a
              href={`https://wa.me/15550100?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 metallic-gradient text-on-primary-fixed font-manrope font-bold px-6 py-3 rounded hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Rent Now - WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
