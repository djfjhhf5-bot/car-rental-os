"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, Wrench, AlertTriangle, Calendar, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMaintenanceRecords,
  deleteMaintenanceRecord,
  getUpcomingMaintenance,
} from "@/lib/actions/maintenance-actions";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

interface VehicleSimple {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface MaintenanceData {
  id: string;
  type: string;
  description: string | null;
  status: string;
  scheduledDate: Date | string | null;
  completedDate: Date | string | null;
  mileage: number | null;
  cost: number | null;
  provider: string | null;
  notes: string | null;
  createdAt: Date | string;
  vehicle: VehicleSimple;
}

interface UpcomingData {
  upcoming: MaintenanceData[];
  overdue: MaintenanceData[];
  vehiclesDue: VehicleSimple[];
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceData[]>([]);
  const [upcomingData, setUpcomingData] = useState<UpcomingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recordsResult, upcomingResult] = await Promise.all([
        getMaintenanceRecords({
          status: statusFilter !== "all" ? statusFilter : undefined,
          vehicleId: vehicleFilter !== "all" ? vehicleFilter : undefined,
        }),
        getUpcomingMaintenance(),
      ]);
      if (recordsResult.data) setRecords(recordsResult.data);
      else setError(recordsResult.error ?? "Failed to load records");
      if (upcomingResult.data) setUpcomingData(upcomingResult.data);
    } catch {
      setError("Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, vehicleFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteMaintenanceRecord(deleteId);
    setDeleting(false);
    setDeleteId(null);
    loadData();
  };

  const uniqueVehicles = useMemo(() => {
    const map = new Map<string, VehicleSimple>();
    records.forEach((r) => map.set(r.vehicle.id, r.vehicle));
    return Array.from(map.values());
  }, [records]);

  const hasAlerts = upcomingData && (upcomingData.overdue.length > 0 || upcomingData.upcoming.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Track vehicle maintenance and service records
          </p>
        </div>
        <Button asChild>
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Link>
        </Button>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </>
      ) : hasAlerts ? (
        <div className="space-y-3">
          {upcomingData!.overdue.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue Maintenance ({upcomingData!.overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingData!.overdue.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.vehicle.brand} {r.vehicle.model}</span>
                        <span className="text-muted-foreground">- {r.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          Due: {r.scheduledDate ? formatDate(r.scheduledDate) : "N/A"}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/maintenance/${r.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {upcomingData!.upcoming.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-600 text-sm">
                  <Calendar className="h-4 w-4" />
                  Upcoming Maintenance (Next 30 Days) - {upcomingData!.upcoming.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingData!.upcoming.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.vehicle.brand} {r.vehicle.model}</span>
                        <span className="text-muted-foreground">- {r.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {r.scheduledDate ? formatDate(r.scheduledDate) : "No date set"}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/maintenance/${r.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {uniqueVehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.brand} {v.model} - {v.licensePlate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {["Vehicle", "Type", "Status", "Date", "Cost", "Actions"].map((h) => (
                      <th key={h} className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 py-16">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadData}>
            Try Again
          </Button>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No maintenance records</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== "all" || vehicleFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first maintenance record"}
          </p>
          {statusFilter === "all" && vehicleFilter === "all" && (
            <Button asChild className="mt-4">
              <Link href="/maintenance/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Vehicle</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Type</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Scheduled</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Cost</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/maintenance/${record.id}`} className="text-sm font-medium hover:underline">
                          {record.vehicle.brand} {record.vehicle.model}
                        </Link>
                        <p className="text-xs text-muted-foreground">{record.vehicle.licensePlate}</p>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{record.type.replace("_", " ")}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status === "in_progress" ? "In Progress" : record.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {record.scheduledDate ? formatDate(record.scheduledDate) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {record.cost ? formatCurrency(record.cost) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/maintenance/${record.id}`}>View</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(record.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Maintenance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this maintenance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
