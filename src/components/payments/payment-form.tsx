"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { createPayment } from "@/lib/actions/payment-actions";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface BookingOption {
  id: string;
  client: { firstName: string; lastName: string };
  vehicle: { brand: string; model: string; licensePlate: string };
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  fullyPaid: boolean;
}

const paymentFormSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  type: z.string().min(1, "Payment type is required"),
  status: z.string().default("paid"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  bookings: BookingOption[];
  defaultBookingId?: string;
}

export function PaymentForm({ bookings, defaultBookingId }: PaymentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema) as any,
    defaultValues: {
      bookingId: defaultBookingId || "",
      amount: 0,
      method: "cash",
      type: "deposit",
      status: "paid",
      reference: "",
      notes: "",
      paidAt: new Date().toISOString().slice(0, 16),
    },
  });

  const selectedBookingId = watch("bookingId");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  const onSubmit = async (data: PaymentFormData) => {
    setSubmitting(true);
    setError(null);

    const result = await createPayment(data);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/payments");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/payments"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Payment</h1>
            <p className="text-sm text-muted-foreground">Record a new payment</p>
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Record Payment
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bookingId" className="mb-2 block">Select Booking</Label>
              <Select
                value={selectedBookingId}
                onValueChange={(v) => setValue("bookingId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      #{b.id.slice(0, 8)} - {b.client.firstName} {b.client.lastName} - {b.vehicle.brand} {b.vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bookingId && (
                <p className="text-sm text-destructive mt-1">{errors.bookingId.message}</p>
              )}
            </div>

            {selectedBooking && (
              <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                <p>Client: <span className="font-medium">{selectedBooking.client.firstName} {selectedBooking.client.lastName}</span></p>
                <p>Vehicle: <span className="font-medium">{selectedBooking.vehicle.brand} {selectedBooking.vehicle.model} ({selectedBooking.vehicle.licensePlate})</span></p>
                <p>Total: <span className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</span></p>
                <p>Deposit Required: <span className="font-medium">{formatCurrency(selectedBooking.depositAmount)}</span></p>
                <p>Deposit Paid: <span className="font-medium">{selectedBooking.depositPaid ? "Yes" : "No"}</span></p>
                <p>Fully Paid: <span className="font-medium">{selectedBooking.fullyPaid ? "Yes" : "No"}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount" className="mb-2 block">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="method" className="mb-2 block">Payment Method</Label>
              <Select
                value={watch("method")}
                onValueChange={(v) => setValue("method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type" className="mb-2 block">Payment Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) => setValue("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="mb-2 block">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference" className="mb-2 block">Reference</Label>
              <Input
                id="reference"
                placeholder="Transaction ID or check number"
                {...register("reference")}
              />
            </div>

            <div>
              <Label htmlFor="paidAt" className="mb-2 block">Payment Date</Label>
              <Input
                id="paidAt"
                type="datetime-local"
                {...register("paidAt")}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="mb-2 block">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Additional notes..."
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
