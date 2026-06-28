"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { createBooking, updateBooking, checkAvailability } from "@/lib/actions/booking-actions";
import { bookingSchema } from "@/lib/validations";
import { formatCurrency, daysBetween } from "@/lib/utils";
import Link from "next/link";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  dailyRate: number;
  category: string;
  status: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

interface ConflictBooking {
  id: string;
  pickupDate: Date | string;
  returnDate: Date | string;
  client: { firstName: string; lastName: string };
}

interface BookingFormProps {
  vehicles: Vehicle[];
  clients: Client[];
  initialData?: {
    id: string;
    status?: string;
    vehicleId: string;
    clientId: string;
    pickupDate: string;
    returnDate: string;
    pickupLocation?: string;
    returnLocation?: string;
    totalAmount: number;
    depositAmount: number;
    notes?: string;
  };
}

export function BookingForm({ vehicles, clients, initialData }: BookingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictBooking[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialData?.vehicleId || ""
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: initialData || {
      vehicleId: "",
      clientId: "",
      pickupDate: "",
      returnDate: "",
      pickupLocation: "",
      returnLocation: "",
      totalAmount: 0,
      depositAmount: 0,
      notes: "",
    },
  });

  const pickupDate = watch("pickupDate");
  const returnDate = watch("returnDate");
  const vehicleId = watch("vehicleId");
  const totalAmount = watch("totalAmount");

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  useEffect(() => {
    if (selectedVehicle && pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const ret = new Date(returnDate);
      if (ret > pickup) {
        const days = daysBetween(pickup, ret);
        const calculated = days * selectedVehicle.dailyRate;
        if (!initialData) {
          setValue("totalAmount", calculated);
        }
      }
    }
  }, [selectedVehicle, pickupDate, returnDate, setValue, initialData]);

  const doCheckAvailability = useCallback(async () => {
    if (!vehicleId || !pickupDate || !returnDate) return;
    setCheckingAvailability(true);
    const result = await checkAvailability(vehicleId, pickupDate, returnDate);
    if (result.data) {
      setConflicts(result.data);
    }
    setCheckingAvailability(false);
  }, [vehicleId, pickupDate, returnDate]);

  useEffect(() => {
    if (vehicleId && pickupDate && returnDate) {
      const timer = setTimeout(doCheckAvailability, 500);
      return () => clearTimeout(timer);
    }
    setConflicts([]);
  }, [vehicleId, pickupDate, returnDate, doCheckAvailability]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setError(null);

    if (conflicts.length > 0 && !initialData) {
      setError("This vehicle has scheduling conflicts for the selected dates.");
      setSubmitting(false);
      return;
    }

    if (data.totalAmount === 0 && selectedVehicle) {
      const pickup = new Date(data.pickupDate);
      const ret = new Date(data.returnDate);
      const days = daysBetween(pickup, ret);
      data.totalAmount = days * selectedVehicle.dailyRate;
    }

    const result = initialData
      ? await updateBooking(initialData.id, data)
      : await createBooking(data);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/bookings");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {initialData ? "Edit Booking" : "New Booking"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialData ? "Update booking details" : "Create a new rental booking"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialData ? "Update Booking" : "Create Booking"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vehicleId" className="mb-2 block">Vehicle</Label>
              <Select
                value={vehicleId}
                onValueChange={(v) => {
                  setValue("vehicleId", v);
                  setSelectedVehicleId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        {v.brand} {v.model} ({v.year}) - {v.licensePlate}
                        <Badge
                          variant={
                            v.status === "available" ? "secondary" : "destructive"
                          }
                          className="ml-2 text-[10px]"
                        >
                          {v.status}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-sm text-destructive mt-1">{errors.vehicleId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="clientId" className="mb-2 block">Client</Label>
              <Select
                value={watch("clientId")}
                onValueChange={(v) => setValue("clientId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.email && <span className="text-muted-foreground ml-2">({c.email})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates & Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickupDate" className="mb-2 block">Pickup Date & Time</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="pickupDate"
                  type="datetime-local"
                  className="pl-10"
                  {...register("pickupDate")}
                />
              </div>
              {errors.pickupDate && (
                <p className="text-sm text-destructive mt-1">{errors.pickupDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="returnDate" className="mb-2 block">Return Date & Time</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="returnDate"
                  type="datetime-local"
                  className="pl-10"
                  {...register("returnDate")}
                />
              </div>
              {errors.returnDate && (
                <p className="text-sm text-destructive mt-1">{errors.returnDate.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupLocation" className="mb-2 block">Pickup Location</Label>
                <Input id="pickupLocation" placeholder="Office address" {...register("pickupLocation")} />
              </div>
              <div>
                <Label htmlFor="returnLocation" className="mb-2 block">Return Location</Label>
                <Input id="returnLocation" placeholder="Office address" {...register("returnLocation")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedVehicle && (
              <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                <p>
                  Vehicle:{" "}
                  <span className="font-medium">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                </p>
                <p>
                  Daily Rate:{" "}
                  <span className="font-medium">
                    {formatCurrency(selectedVehicle.dailyRate)}
                  </span>
                </p>
                {pickupDate && returnDate && new Date(returnDate) > new Date(pickupDate) && (
                  <p>
                    Duration:{" "}
                    <span className="font-medium">
                      {daysBetween(new Date(pickupDate), new Date(returnDate))} day(s)
                    </span>
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="totalAmount" className="mb-2 block">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                {...register("totalAmount")}
              />
              {errors.totalAmount && (
                <p className="text-sm text-destructive mt-1">{errors.totalAmount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="depositAmount" className="mb-2 block">Deposit Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("depositAmount")}
              />
              {errors.depositAmount && (
                <p className="text-sm text-destructive mt-1">{errors.depositAmount.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes" className="mb-2 block">Notes</Label>
              <textarea
                id="notes"
                rows={6}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                placeholder="Special requests, additional notes..."
                {...register("notes")}
              />
            </div>

            {conflicts.length > 0 && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Availability Conflict</span>
                </div>
                <p className="text-sm text-destructive/80 mb-2">
                  This vehicle has {conflicts.length} overlapping booking(s):
                </p>
                <ul className="space-y-1 text-xs text-destructive/70">
                  {conflicts.map((c) => (
                    <li key={c.id}>
                      {new Date(c.pickupDate).toLocaleDateString()} -{" "}
                      {new Date(c.returnDate).toLocaleDateString()} (
                      {c.client.firstName} {c.client.lastName})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {checkingAvailability && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking availability...
              </div>
            )}

            {!checkingAvailability &&
              conflicts.length === 0 &&
              vehicleId &&
              pickupDate &&
              returnDate &&
              new Date(returnDate) > new Date(pickupDate) && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Vehicle is available for the selected dates.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
