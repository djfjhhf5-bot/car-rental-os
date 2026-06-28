"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { vehicleSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: VehicleFormData & { id?: string };
  onSubmit: (data: VehicleFormData) => Promise<{ success: boolean; error?: string | Record<string, string[]> }>;
}

export function VehicleForm({ initialData, onSubmit }: VehicleFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: initialData ?? {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      licensePlate: "",
      vin: "",
      category: "standard",
      transmission: "automatic",
      fuelType: "gasoline",
      seats: 5,
      doors: 4,
      dailyRate: 0,
      weeklyRate: undefined,
      monthlyRate: undefined,
      depositAmount: 0,
      mileageLimit: undefined,
      mileageUnit: "km",
      location: "",
      description: "",
      imageUrl: "",
      insuranceExpiry: "",
      registrationExpiry: "",
      serviceInterval: undefined,
      notes: "",
      published: false,
    },
  });

  const dailyRate = watch("dailyRate");

  useEffect(() => {
    if (dailyRate && dailyRate > 0) {
      if (!watch("weeklyRate") || watch("weeklyRate") === 0) {
        setValue("weeklyRate", Math.round(dailyRate * 7 * 100) / 100);
      }
      if (!watch("monthlyRate") || watch("monthlyRate") === 0) {
        setValue("monthlyRate", Math.round(dailyRate * 30 * 100) / 100);
      }
    }
  }, [dailyRate, setValue, watch]);

  async function handleFormSubmit(data: VehicleFormData) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await onSubmit(data);
      if (!result.success) {
        setServerError(typeof result.error === "string" ? result.error : "Please check the form for errors");
      }
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Input id="brand" {...register("brand")} />
            {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" {...register("model")} />
            {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input id="year" type="number" {...register("year", { valueAsNumber: true })} />
            {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" {...register("color")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input id="licensePlate" {...register("licensePlate")} />
            {errors.licensePlate && <p className="text-xs text-destructive">{errors.licensePlate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input id="vin" {...register("vin")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              {...register("category")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="economy">Economy</option>
              <option value="standard">Standard</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Specifications</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <select
              id="transmission"
              {...register("transmission")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <select
              id="fuelType"
              {...register("fuelType")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats">Seats</Label>
            <Input id="seats" type="number" {...register("seats", { valueAsNumber: true })} />
            {errors.seats && <p className="text-xs text-destructive">{errors.seats.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="doors">Doors</Label>
            <Input id="doors" type="number" {...register("doors", { valueAsNumber: true })} />
            {errors.doors && <p className="text-xs text-destructive">{errors.doors.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Rates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dailyRate">Daily Rate *</Label>
            <Input id="dailyRate" type="number" step="0.01" {...register("dailyRate", { valueAsNumber: true })} />
            {errors.dailyRate && <p className="text-xs text-destructive">{errors.dailyRate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyRate">Weekly Rate</Label>
            <Input id="weeklyRate" type="number" step="0.01" {...register("weeklyRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyRate">Monthly Rate</Label>
            <Input id="monthlyRate" type="number" step="0.01" {...register("monthlyRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <Input id="depositAmount" type="number" step="0.01" {...register("depositAmount", { valueAsNumber: true })} />
            {errors.depositAmount && <p className="text-xs text-destructive">{errors.depositAmount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileageLimit">Mileage Limit</Label>
            <Input id="mileageLimit" type="number" {...register("mileageLimit", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileageUnit">Mileage Unit</Label>
            <select
              id="mileageUnit"
              {...register("mileageUnit")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="km">KM</option>
              <option value="mi">Miles</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" type="url" {...register("imageUrl")} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
            <Input id="insuranceExpiry" type="date" {...register("insuranceExpiry")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationExpiry">Registration Expiry</Label>
            <Input id="registrationExpiry" type="date" {...register("registrationExpiry")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceInterval">Service Interval (km)</Label>
            <Input id="serviceInterval" type="number" {...register("serviceInterval", { valueAsNumber: true })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea id="notes" {...register("notes")} rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="published" {...register("published")} className="h-4 w-4 rounded border-gray-300" />
          <Label htmlFor="published">Publish on website</Label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Vehicle" : "Create Vehicle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
