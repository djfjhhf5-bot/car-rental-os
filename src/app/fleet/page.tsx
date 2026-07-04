"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/fleet/vehicle-card";
import { getVehicles } from "@/lib/actions/fleet-actions";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  dailyRate: number;
  status: string;
  imageUrl: string | null;
  transmission: string;
  seats: number;
  published: boolean;
}

export default function FleetPage() {
  const { lang } = useLanguage();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadVehicles() {
    try {
      setLoading(true);
      setError(null);
      const result = await getVehicles();
      if (result.success) {
        setVehicles(result.data ?? []);
      } else {
        setError(result.error ?? t("fleetDash.loadError", lang));
      }
    } catch {
      setError(t("fleetDash.loadError", lang));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.licensePlate.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("fleetDash.title", lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {t("fleetDash.subtitle", lang)}
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("fleetDash.addVehicle", lang)}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.searchBrandModel", lang)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("common.allStatuses", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses", lang)}</SelectItem>
            <SelectItem value="available">{t("common.available", lang)}</SelectItem>
            <SelectItem value="booked">{t("common.booked", lang)}</SelectItem>
            <SelectItem value="maintenance">{t("common.maintenance", lang)}</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 py-16">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadVehicles}>
            {t("common.tryAgain", lang)}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Car className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t("fleetDash.noVehicles", lang)}</p>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? t("common.noResultsDesc", lang)
              : t("fleetDash.addFirst", lang)}
          </p>
          {!search && statusFilter === "all" && (
            <Button asChild className="mt-4">
              <Link href="/fleet/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("fleetDash.addVehicle", lang)}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onStatusChange={loadVehicles}
            />
          ))}
        </div>
      )}
    </div>
  );
}
