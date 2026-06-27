"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { getContracts, deleteContract, createContract } from "@/lib/actions/contract-actions";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

interface ContractData {
  id: string;
  contractNumber: string;
  status: string;
  signedByClient: boolean;
  signedByAgency: boolean;
  createdAt: Date | string;
  pickupOdometer: number | null;
  returnOdometer: number | null;
  client: { id: string; firstName: string; lastName: string };
  booking: { id: string; totalAmount: number; vehicle: { brand: string; model: string; licensePlate: string } };
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getContracts({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      if (result.data) {
        setContracts(result.data);
      } else {
        setError(result.error ?? "Failed to load contracts");
      }
    } catch {
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteContract(deleteId);
    setDeleting(false);
    setDeleteId(null);
    loadContracts();
  };

  const filtered = useMemo(() => {
    if (!search) return contracts;
    const q = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(q) ||
        `${c.client.firstName} ${c.client.lastName}`.toLowerCase().includes(q)
    );
  }, [contracts, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage rental contracts and signatures
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by contract number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
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
                    {["Contract #", "Client", "Vehicle", "Status", "Dates", "Actions"].map((h) => (
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
          <Button variant="outline" className="mt-4" onClick={loadContracts}>
            Try Again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No contracts found</p>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Contracts are auto-generated from confirmed bookings"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Contract #</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Client</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Vehicle</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Created</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contract) => (
                    <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/contracts/${contract.id}`} className="font-mono text-sm font-medium hover:underline">
                          {contract.contractNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/contracts/${contract.id}`} className="text-sm hover:underline">
                          {contract.client.firstName} {contract.client.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {contract.booking.vehicle.brand} {contract.booking.vehicle.model}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                          {contract.signedByClient && contract.signedByAgency && (
                            <Badge className="bg-green-100 text-green-800">All Signed</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(contract.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/contracts/${contract.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(contract.id)}
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
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone.
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
