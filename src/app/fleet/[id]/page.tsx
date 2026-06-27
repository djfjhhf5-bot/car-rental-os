"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Car,
  Calendar,
  Wrench,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVehicle, deleteVehicle } from "@/lib/actions/fleet-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Available", variant: "default" },
  booked: { label: "Booked", variant: "secondary" },
  maintenance: { label: "Maintenance", variant: "destructive" },
  rented: { label: "Rented", variant: "outline" },
  inactive: { label: "Inactive", variant: "outline" },
};

interface VehicleDetail {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  licensePlate: string;
  vin: string | null;
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
  images: string;
  published: boolean;
  insuranceExpiry: Date | string | null;
  registrationExpiry: Date | string | null;
  lastServiceMileage: number | null;
  serviceInterval: number | null;
  notes: string | null;
  bookings: Array<{
    id: string;
    status: string;
    pickupDate: Date | string;
    returnDate: Date | string;
    client: { firstName: string; lastName: string; phone: string | null; email: string | null };
  }>;
  maintenanceLogs: Array<{
    id: string;
    type: string;
    description: string | null;
    scheduledDate: Date | string | null;
    completedDate: Date | string | null;
    cost: number | null;
    status: string;
  }>;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadVehicle() {
    try {
      setLoading(true);
      setError(null);
      const result = await getVehicle(id);
      if (result.success) {
        setVehicle(result.data as VehicleDetail);
      } else {
        setError(result.error ?? "Vehicle not found");
      }
    } catch {
      setError("Failed to load vehicle");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicle();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteVehicle(id);
    setDeleting(false);
    if (result.success) {
      router.push("/fleet");
      router.refresh();
    } else {
      setError(result.error ?? "Failed to delete");
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
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

  const config = statusConfig[vehicle.status] || { label: vehicle.status, variant: "outline" as const };
  const upcomingBookings = vehicle.bookings.filter(
    (b) => b.status !== "cancelled" && new Date(b.pickupDate) >= new Date()
  );
  const pastBookings = vehicle.bookings.filter(
    (b) => b.status === "cancelled" || new Date(b.pickupDate) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {vehicle.brand} {vehicle.model}
              </h1>
              <Badge variant={config.variant}>{config.label}</Badge>
              <Badge variant={vehicle.published ? "default" : "secondary"}>
                {vehicle.published ? "Published" : "Hidden"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.year} &middot; {vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fleet/${vehicle.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Vehicle</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="relative h-64 bg-muted">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Car className="h-20 w-20 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {vehicle.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{vehicle.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Transmission</p>
                  <p className="text-sm font-medium capitalize">{vehicle.transmission}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fuel Type</p>
                  <p className="text-sm font-medium capitalize">{vehicle.fuelType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seats</p>
                  <p className="text-sm font-medium">{vehicle.seats}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Doors</p>
                  <p className="text-sm font-medium">{vehicle.doors}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium capitalize">{vehicle.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Color</p>
                  <p className="text-sm font-medium capitalize">{vehicle.color || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">VIN</p>
                  <p className="text-sm font-medium">{vehicle.vin || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mileage Limit</p>
                  <p className="text-sm font-medium">
                    {vehicle.mileageLimit ? `${vehicle.mileageLimit.toLocaleString()} ${vehicle.mileageUnit}` : "Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service Interval</p>
                  <p className="text-sm font-medium">
                    {vehicle.serviceInterval ? `${vehicle.serviceInterval.toLocaleString()} km` : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No upcoming bookings</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {booking.client.firstName} {booking.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.maintenanceLogs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No maintenance records</p>
              ) : (
                <div className="space-y-3">
                  {vehicle.maintenanceLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium capitalize">{log.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.scheduledDate ? formatDate(log.scheduledDate) : "No date"}
                            {log.cost ? ` - ${formatCurrency(log.cost)}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant={log.status === "completed" ? "default" : "secondary"}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Rate</span>
                <span className="text-lg font-bold">{formatCurrency(vehicle.dailyRate)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Weekly Rate</span>
                <span className="font-medium">
                  {vehicle.weeklyRate ? formatCurrency(vehicle.weeklyRate) : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Rate</span>
                <span className="font-medium">
                  {vehicle.monthlyRate ? formatCurrency(vehicle.monthlyRate) : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deposit</span>
                <span className="font-medium">{formatCurrency(vehicle.depositAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{vehicle.location || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Insurance Expiry</p>
                <p className="text-sm font-medium">
                  {vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registration Expiry</p>
                <p className="text-sm font-medium">
                  {vehicle.registrationExpiry ? formatDate(vehicle.registrationExpiry) : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {pastBookings.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No past bookings</p>
              ) : (
                <div className="space-y-3">
                  {pastBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="text-sm">
                      <p className="font-medium">
                        {booking.client.firstName} {booking.client.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.pickupDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
