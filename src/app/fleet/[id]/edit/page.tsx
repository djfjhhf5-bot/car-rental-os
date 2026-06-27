"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleForm } from "@/components/fleet/vehicle-form";
import { getVehicle, updateVehicle } from "@/lib/actions/fleet-actions";
import { vehicleSchema } from "@/lib/validations";
import { z } from "zod";

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<(VehicleFormData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getVehicle(id);
        if (result.success && result.data) {
          const v = result.data as Record<string, unknown>;
          setVehicle({
            id: v.id as string,
            brand: v.brand as string,
            model: v.model as string,
            year: v.year as number,
            color: (v.color as string) ?? "",
            licensePlate: v.licensePlate as string,
            vin: (v.vin as string) ?? "",
            category: v.category as string,
            transmission: v.transmission as string,
            fuelType: v.fuelType as string,
            seats: v.seats as number,
            doors: v.doors as number,
            dailyRate: v.dailyRate as number,
            weeklyRate: v.weeklyRate as number | undefined,
            monthlyRate: v.monthlyRate as number | undefined,
            depositAmount: v.depositAmount as number,
            mileageLimit: v.mileageLimit as number | undefined,
            mileageUnit: v.mileageUnit as string,
            location: (v.location as string) ?? "",
            description: (v.description as string) ?? "",
            imageUrl: (v.imageUrl as string) ?? "",
            insuranceExpiry: v.insuranceExpiry
              ? new Date(v.insuranceExpiry as string).toISOString().split("T")[0]
              : "",
            registrationExpiry: v.registrationExpiry
              ? new Date(v.registrationExpiry as string).toISOString().split("T")[0]
              : "",
            serviceInterval: v.serviceInterval as number | undefined,
            notes: (v.notes as string) ?? "",
          });
        } else {
          setError(result.error ?? "Vehicle not found");
        }
      } catch {
        setError("Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data: VehicleFormData) {
    const result = await updateVehicle(id, data);
    if (result.success) {
      router.push(`/fleet/${id}`);
      router.refresh();
    }
    return result;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error ?? "Vehicle not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/fleet")}>
          Back to Fleet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href={`/fleet/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit {vehicle.brand} {vehicle.model}
          </h1>
          <p className="text-sm text-muted-foreground">
            Update vehicle information
          </p>
        </div>
      </div>

      <VehicleForm initialData={vehicle} onSubmit={handleSubmit} />
    </div>
  );
}
