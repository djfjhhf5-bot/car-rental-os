"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getMaintenanceRecord,
  deleteMaintenanceRecord,
} from "@/lib/actions/maintenance-actions";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

interface MaintenanceDetail {
  id: string;
  type: string;
  description: string | null;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  mileage: number | null;
  cost: number | null;
  provider: string | null;
  notes: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMaintenanceRecord(id);
      if (result.data) {
        setRecord(result.data as unknown as MaintenanceDetail);
      } else {
        setError(result.error || "Maintenance record not found");
      }
    } catch {
      setError("Failed to load maintenance record");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteMaintenanceRecord(id);
    setDeleting(false);
    if (result.success) {
      router.push("/maintenance");
      router.refresh();
    } else {
      setError(result.error || "Failed to delete");
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 py-16">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error || "Record not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/maintenance">Back to Maintenance</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              Maintenance Record
            </h1>
            <p className="text-sm text-muted-foreground">
              {record.vehicle.brand} {record.vehicle.model} - {record.vehicle.licensePlate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/maintenance/new?id=${record.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{record.type.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(record.status)}>
                  {record.status === "in_progress" ? "In Progress" : record.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">
                  {record.vehicle.brand} {record.vehicle.model} ({record.vehicle.year})
                </p>
                <p className="text-xs text-muted-foreground">{record.vehicle.licensePlate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">{record.provider || "—"}</p>
              </div>
            </div>
            {record.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{record.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule & Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">
                  {record.scheduledDate ? formatDate(record.scheduledDate) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Date</p>
                <p className="font-medium">
                  {record.completedDate ? formatDate(record.completedDate) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost</p>
                <p className="font-medium">
                  {record.cost ? formatCurrency(record.cost) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mileage</p>
                <p className="font-medium">
                  {record.mileage ? `${record.mileage.toLocaleString()} km` : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(record.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {record.notes && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Maintenance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this maintenance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
