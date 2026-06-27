"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { createMaintenanceRecord, updateMaintenanceRecord } from "@/lib/actions/maintenance-actions";
import Link from "next/link";

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional().or(z.literal("")),
  cost: z.coerce.number().min(0).optional().or(z.literal("")),
  provider: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  vehicles: VehicleOption[];
  initialData?: MaintenanceFormData & { id: string };
}

export function MaintenanceForm({ vehicles, initialData }: MaintenanceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema) as any,
    defaultValues: initialData || {
      vehicleId: "",
      type: "service",
      description: "",
      scheduledDate: "",
      completedDate: "",
      mileage: undefined,
      cost: undefined,
      provider: "",
      notes: "",
      status: "pending",
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    setSubmitting(true);
    setError(null);

    const result = initialData
      ? await updateMaintenanceRecord(initialData.id, data)
      : await createMaintenanceRecord(data);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/maintenance");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/maintenance"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {initialData ? "Edit Maintenance Record" : "New Maintenance Record"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialData ? "Update maintenance details" : "Log a new maintenance record"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialData ? "Update Record" : "Create Record"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vehicleId" className="mb-2 block">Vehicle</Label>
              <Select
                value={watch("vehicleId")}
                onValueChange={(v) => setValue("vehicleId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year}) - {v.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-sm text-destructive mt-1">{errors.vehicleId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="type" className="mb-2 block">Maintenance Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) => setValue("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="tire">Tire Change</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of work needed"
                {...register("description")}
              />
            </div>

            <div>
              <Label htmlFor="provider" className="mb-2 block">Service Provider</Label>
              <Input
                id="provider"
                placeholder="Garage or mechanic name"
                {...register("provider")}
              />
            </div>

            <div>
              <Label htmlFor="cost" className="mb-2 block">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("cost")}
              />
              {errors.cost && (
                <p className="text-sm text-destructive mt-1">{errors.cost.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status" className="mb-2 block">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduledDate" className="mb-2 block">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                {...register("scheduledDate")}
              />
            </div>

            <div>
              <Label htmlFor="completedDate" className="mb-2 block">Completed Date</Label>
              <Input
                id="completedDate"
                type="date"
                {...register("completedDate")}
              />
            </div>

            <div>
              <Label htmlFor="mileage" className="mb-2 block">Mileage at Service</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="e.g. 50000"
                {...register("mileage")}
              />
              {errors.mileage && (
                <p className="text-sm text-destructive mt-1">{errors.mileage.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes" className="mb-2 block">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Additional notes or parts used..."
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
