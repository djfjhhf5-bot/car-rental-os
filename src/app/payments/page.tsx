"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, DollarSign, Trash2, Loader2 } from "lucide-react";
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
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all payments
          </p>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
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
              Total Transactions
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
              Paid Transactions
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
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
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
                    {["Amount", "Method", "Type", "Status", "Booking", "Date", "Actions"].map((h) => (
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
            Try Again
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No payments found</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Record your first payment to get started"}
          </p>
          {statusFilter === "all" && typeFilter === "all" && (
            <Button asChild className="mt-4">
              <Link href="/payments/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
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
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Amount</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Method</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Type</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Booking</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Date</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
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
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? The booking payment status will be recalculated.
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
