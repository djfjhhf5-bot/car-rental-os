"use client";

import { useUserSession } from "@/components/providers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { getVehicles } from "@/lib/actions/fleet-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

export default function NewMaintenancePage() {
  const { user, loading } = useUserSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      try {
        const result = await getVehicles();
        if (result.success && result.data) setVehicles(result.data);
      } catch {
        // Handle error
      } finally {
        setLoadingVehicles(false);
      }
    }
    load();
  }, []);

  if (loading || loadingVehicles) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Maintenance Record</h1>
        <p className="text-muted-foreground">Add a maintenance record for a vehicle</p>
      </div>
      <MaintenanceForm vehicles={vehicles} />
    </div>
  );
}
