"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClients, deleteClient } from "@/lib/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Mail,
  Phone,
  User,
  Edit,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

function ClientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get("search") || "";

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getClients(search);
      if (result.data) {
        setClients(result.data);
      } else {
        setError(result.error ?? "Failed to load clients");
      }
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteClient(deleteId);
    setDeleting(false);
    if (result.success) {
      toast({ title: "Deleted", description: "Client deleted successfully", variant: "success" as const });
      setDeleteId(null);
      loadClients();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" as const });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your rental clients
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                placeholder="Search by name, email, or phone..."
                className="pl-10"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Name</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Phone</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Email</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">License</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">Bookings</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Clients</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={loadClients}>Try Again</Button>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {search ? "No clients found" : "No clients yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {search
              ? "Try a different search term"
              : "Add your first client to get started"}
          </p>
          {!search && (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
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
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Name
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Phone
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Email
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      License
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">
                      Bookings
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {client.firstName[0]}
                            {client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {client.firstName} {client.lastName}
                            </p>
                            {client.city && (
                              <p className="text-xs text-muted-foreground">
                                {client.city}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {client.phone ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.email ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.licenseNumber ? (
                          <span className="text-sm">{client.licenseNumber}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary">
                          {client._count.bookings}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}`}>
                              <User className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(client.id)}
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
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
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

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ClientsContent />
    </Suspense>
  );
}
