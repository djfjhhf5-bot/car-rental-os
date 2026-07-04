"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
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
  const { lang } = useLanguage();
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
          <h1 className="text-2xl font-bold tracking-tight">{t("contracts.title", lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {t("contracts.subtitle", lang)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.searchContract", lang)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("common.allStatuses", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses", lang)}</SelectItem>
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
                    {[t("contracts.contractNo", lang), t("contracts.client", lang), t("contracts.vehicle", lang), t("contracts.status", lang), t("contracts.created", lang), t("common.actions", lang)].map((h) => (
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
            {t("common.tryAgain", lang)}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t("contracts.noContracts", lang)}</p>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? t("common.noResultsDesc", lang)
              : t("contracts.autoGenerated", lang)}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("contracts.contractNo", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("contracts.client", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("contracts.vehicle", lang)}</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">{t("contracts.status", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("contracts.created", lang)}</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">{t("common.actions", lang)}</th>
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
                            <Badge className="bg-green-100 text-green-800">{t("contracts.allSigned", lang)}</Badge>
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
            <DialogTitle>{t("contracts.deleteTitle", lang)}</DialogTitle>
            <DialogDescription>
              {t("contracts.deleteDesc", lang)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel", lang)}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
