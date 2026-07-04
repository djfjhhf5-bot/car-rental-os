"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, DollarSign, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getPayments, deletePayment } from "@/lib/actions/payment-actions";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";

interface PaymentData {
  id: string;
  amount: number;
  method: string;
  type: string;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date | string;
  paidAt: Date | string | null;
  booking: {
    id: string;
    client: { firstName: string; lastName: string };
    vehicle: { brand: string; model: string; licensePlate: string };
  };
  user: { name: string };
}

export default function PaymentsPage() {
  const { lang } = useLanguage();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPayments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
      if (result.data) {
        setPayments(result.data);
      } else {
        setError(result.error ?? "Failed to load payments");
      }
    } catch {
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deletePayment(deleteId);
    setDeleting(false);
    setDeleteId(null);
    loadPayments();
  };

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("payments.title", lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {t("payments.subtitle", lang)}
          </p>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("payments.recordPayment", lang)}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("payments.totalRevenue", lang)}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("payments.totalTransactions", lang)}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("payments.paidTransactions", lang)}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {payments.filter((p) => p.status === "paid").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("common.allStatuses", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses", lang)}</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("common.allTypes", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allTypes", lang)}</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
                    {[t("payments.amount", lang), t("payments.method", lang), t("payments.type", lang), t("payments.status", lang), t("payments.booking", lang), t("payments.date", lang), t("common.actions", lang)].map((h) => (
                      <th key={h} className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
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
          <Button variant="outline" className="mt-4" onClick={loadPayments}>
            {t("common.tryAgain", lang)}
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t("payments.noPayments", lang)}</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== "all" || typeFilter !== "all"
              ? t("payments.adjustFilters", lang)
              : t("payments.firstPayment", lang)}
          </p>
          {statusFilter === "all" && typeFilter === "all" && (
            <Button asChild className="mt-4">
              <Link href="/payments/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("payments.recordPayment", lang)}
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
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.amount", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.method", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.type", lang)}</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.status", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.booking", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("payments.date", lang)}</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">{t("common.actions", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{payment.method.replace("_", " ")}</td>
                      <td className="px-6 py-4 text-sm capitalize">{payment.type}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/bookings/${payment.booking.id}`}
                          className="text-sm font-mono text-muted-foreground hover:underline"
                        >
                          #{payment.booking.id.slice(0, 8)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {payment.booking.client.firstName} {payment.booking.client.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(payment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
            <DialogTitle>{t("payments.deleteTitle", lang)}</DialogTitle>
            <DialogDescription>
              {t("payments.deleteDesc", lang)}
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
