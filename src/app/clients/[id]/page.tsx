"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClient, deleteClient } from "@/lib/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Calendar,
  BookOpen,
  Car,
  Users,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadClient() {
    try {
      setLoading(true);
      setError(null);
      const result = await getClient(id);
      if (result.data) {
        setClient(result.data);
      } else {
        setError(result.error ?? "Client not found");
      }
    } catch {
      setError("Failed to load client");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(id);
    setDeleting(false);
    if (result.success) {
      router.push("/clients");
      router.refresh();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" as const });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <Users className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{error || "Client not found"}</p>
        <Button asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  const infoCards = [
    { icon: Mail, label: "Email", value: client.email || "—" },
    { icon: Phone, label: "Phone", value: client.phone || "—" },
    { icon: Phone, label: "WhatsApp", value: client.whatsapp || "—" },
    { icon: MapPin, label: "Address", value: [client.address, client.city, client.country].filter(Boolean).join(", ") || "—" },
    { icon: IdCard, label: "License Number", value: client.licenseNumber || "—" },
    {
      icon: Calendar,
      label: "License Expiry",
      value: client.licenseExpiry ? formatDate(client.licenseExpiry) : "—",
    },
    { icon: IdCard, label: "ID Number", value: client.idNumber || "—" },
    {
      icon: Calendar,
      label: "Client Since",
      value: formatDate(client.createdAt),
    },
  ];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      inquiry: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      active: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Client profile with booking history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
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
                <DialogTitle>Delete Client</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {client.firstName} {client.lastName}? This action cannot be undone.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoCards.slice(0, 4).map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" />
              License & ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoCards.slice(4).map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Booking History
            <Badge variant="secondary" className="ml-2">
              {client._count.bookings}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {client.bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No bookings yet</h3>
              <p className="text-sm text-muted-foreground">
                This client hasn&apos;t made any bookings
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">ID</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Vehicle</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Pickup</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Return</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Amount</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.bookings.map((booking: any) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-muted-foreground">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.vehicle.brand} {booking.vehicle.model}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDate(booking.pickupDate)}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(booking.returnDate)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/bookings/${booking.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
