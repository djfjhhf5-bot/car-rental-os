"use client";

import Image from "next/image";
import Link from "next/link";
import { Gauge, Users, Fuel } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";

interface CarCardProps {
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

export function CarCard({ id, brand, model, year, transmission, fuelType, seats, dailyRate, category, imageUrl }: CarCardProps) {
  const { lang } = useLanguage();
  const initials = `${brand[0]}${model[0]}`.toUpperCase();
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="group relative rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 ambient-shadow transition-transform hover:-translate-y-2 duration-300">
      <div className="absolute top-4 right-4 z-10 bg-primary/10 border border-primary/50 text-primary font-jetbrains-mono text-label-sm px-3 py-1 rounded backdrop-blur-sm tracking-widest">
        {year}
      </div>
      <Link href={`/rent/cars/${id}`}>
        <div className="h-64 w-full relative bg-surface-container-high overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${brand} ${model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-dim flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-500">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                  <span className="font-jetbrains-mono text-label-sm font-bold text-primary">{initials}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("chat:ask", {
                  detail: { message: `Tell me about the ${brand} ${model}'s features, pricing and availability` },
                })
              );
            }}
            className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md border border-white/30 text-white font-manrope font-bold px-4 py-2 rounded-lg text-xs hover:bg-white/20 transition-all shadow-lg"
          >
            {t("car.ask", lang)}
          </button>
        </div>
      </Link>
      <div className="p-6 flex flex-col gap-4 relative z-10 bg-surface-container-lowest">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/rent/cars/${id}`}>
              <h3 className="font-montserrat text-headline-lg-mobile text-on-surface mb-1 hover:text-primary transition-colors">
                {brand} {model}
              </h3>
            </Link>
            <span className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase border border-outline-variant px-2 py-0.5 rounded">
              {categoryLabel}
            </span>
          </div>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent my-2" />
        <div className="flex gap-4 font-manrope text-body-md text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="capitalize">{transmission}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>{seats}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="h-4 w-4 text-primary" />
            <span className="capitalize">{fuelType === "gasoline" ? "Petrol" : fuelType}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-manrope text-body-md text-on-surface-variant">
            {t("car.from", lang)} <strong className="text-primary font-bold">{formatCurrency(dailyRate)}</strong>
            <span className="text-sm">{t("car.perDay", lang)}</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/rent/cars/${id}`}
              className="text-primary hover:text-primary-fixed transition-colors flex items-center gap-1 font-jetbrains-mono text-label-sm uppercase tracking-widest"
            >
              {t("car.details", lang)}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
