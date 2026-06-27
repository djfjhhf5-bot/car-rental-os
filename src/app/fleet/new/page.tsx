"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/fleet/vehicle-form";
import { createVehicle } from "@/lib/actions/fleet-actions";

export default function NewVehiclePage() {
  const router = useRouter();

  async function handleSubmit(data: unknown) {
    const result = await createVehicle(data);
    if (result.success) {
      router.push("/fleet");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/fleet">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Vehicle</h1>
          <p className="text-sm text-muted-foreground">
            Add a new vehicle to your fleet
          </p>
        </div>
      </div>

      <VehicleForm onSubmit={handleSubmit} />
    </div>
  );
}
