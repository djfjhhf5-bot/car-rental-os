"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

interface CarDetailInfo {
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

interface OrderFormProps {
  agency: string;
  vehicleId?: string;
  vehicleName?: string;
  carDetails?: CarDetailInfo | null;
  onClose: () => void;
}

export function OrderForm({ agency, vehicleId, vehicleName, carDetails, onClose }: OrderFormProps) {
  const { lang } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency,
          name,
          phone,
          email: email || undefined,
          vehicleId: vehicleId || undefined,
          pickupDate: pickupDate || undefined,
          returnDate: returnDate || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.error || "Failed to submit");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 ambient-shadow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-montserrat text-headline-lg-mobile text-on-surface">
            {vehicleName || t("car.orderNow", lang)}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {carDetails && (
          <div className="mb-6 rounded-lg bg-surface-container-high border border-outline-variant/30 p-4">
            <h3 className="font-montserrat text-headline-sm text-on-surface mb-2">{carDetails.brand} {carDetails.model} ({carDetails.year})</h3>
            <div className="flex flex-wrap gap-3 text-sm font-manrope text-on-surface-variant">
              <span className="capitalize border border-outline-variant/50 px-2 py-0.5 rounded">{carDetails.category}</span>
              <span>{t("car.transmission", lang)}: <strong className="text-on-surface capitalize">{carDetails.transmission}</strong></span>
              <span>{t("car.seats", lang)}: <strong className="text-on-surface">{carDetails.seats}</strong></span>
              <span>{t("car.fuelType", lang)}: <strong className="text-on-surface capitalize">{carDetails.fuelType === "gasoline" ? "Petrol" : carDetails.fuelType}</strong></span>
              <span className="text-primary font-bold">{formatCurrency(carDetails.dailyRate)}{t("car.perDay", lang)}</span>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-manrope text-body-md text-on-surface">{t("order.success", lang)}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                {t("order.name", lang)}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("order.namePlaceholder", lang)}
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                {t("order.phone", lang)}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("order.phonePlaceholder", lang)}
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                {t("order.email", lang)}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("order.emailPlaceholder", lang)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                  {t("order.pickupDate", lang)}
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                  {t("order.returnDate", lang)}
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="font-jetbrains-mono text-label-sm text-on-surface-variant tracking-widest uppercase block mb-1">
                {t("order.notes", lang)}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("order.notesPlaceholder", lang)}
                rows={3}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 font-manrope text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            {error && (
              <p className="text-error text-sm font-manrope text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !name || !phone}
              className="w-full metallic-gradient text-on-primary-fixed font-manrope font-bold py-3 rounded hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
            >
              {submitting ? t("order.submitting", lang) : t("order.submit", lang)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
