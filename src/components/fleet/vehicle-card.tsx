"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateVehicleStatus, toggleVehiclePublish } from "@/lib/actions/fleet-actions";
import { formatCurrency } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Available", variant: "default" },
  booked: { label: "Booked", variant: "secondary" },
  maintenance: { label: "Maintenance", variant: "destructive" },
  rented: { label: "Rented", variant: "outline" },
  inactive: { label: "Inactive", variant: "outline" },
};

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

interface VehicleCardProps {
  vehicle: VehicleData;
  onStatusChange?: () => void;
}

export function VehicleCard({ vehicle, onStatusChange }: VehicleCardProps) {
  const [updating, setUpdating] = useState(false);
  const config = statusConfig[vehicle.status] || { label: vehicle.status, variant: "outline" as const };

  async function handleStatusChange(status: string) {
    setUpdating(true);
    await updateVehicleStatus(vehicle.id, status);
    setUpdating(false);
    onStatusChange?.();
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-muted">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Car className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          <Badge variant={vehicle.published ? "default" : "secondary"}>
            {vehicle.published ? "Published" : "Hidden"}
          </Badge>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-3">
          <Link href={`/fleet/${vehicle.id}`} className="hover:underline">
            <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{vehicle.year}</p>
        </div>
        <div className="mb-3 space-y-1 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-medium text-foreground">{vehicle.licensePlate}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="capitalize">{vehicle.transmission}</span>
            <span>&middot;</span>
            <span>{vehicle.seats} seats</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">
            {formatCurrency(vehicle.dailyRate)}
            <span className="text-sm font-normal text-muted-foreground">/day</span>
          </p>
          <div className="flex items-center gap-1">
            <Select
              value={vehicle.status}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/fleet/${vehicle.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
