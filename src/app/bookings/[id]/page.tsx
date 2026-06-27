import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBooking } from "@/lib/actions/booking-actions";
import { updateBookingStatusAction } from "@/lib/actions/booking-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Check,
  Clock,
  ChevronRight,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Receipt,
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  inquiry: {
    label: "Inquiry",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <Clock className="h-4 w-4" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <Check className="h-4 w-4" />,
  },
  active: {
    label: "Active",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: <Play className="h-4 w-4" />,
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const statusFlow = ["inquiry", "confirmed", "active", "completed"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 py-2">
      {statusFlow.map((status, index) => {
        const config = statusConfig[status];
        const isActive = index <= currentIndex;
        const isCurrent = status === currentStatus;

        return (
          <div key={status} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? config.color
                  : isActive
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              }`}
            >
              {config.icon}
              {config.label}
            </div>
            {index < statusFlow.length - 1 && (
              <ChevronRight
                className={`h-4 w-4 mx-1 ${
                  index < currentIndex
                    ? "text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusActions({ bookingId, status }: { bookingId: string; status: string }) {
  const actions: Array<{
    label: string;
    newStatus: string;
    icon: React.ReactNode;
    variant?: "default" | "outline" | "destructive" | "secondary";
  }> = [];

  if (status === "inquiry") {
    actions.push(
      { label: "Confirm Booking", newStatus: "confirmed", icon: <Check className="h-4 w-4" />, variant: "default" },
      { label: "Cancel Booking", newStatus: "cancelled", icon: <XCircle className="h-4 w-4" />, variant: "destructive" }
    );
  } else if (status === "confirmed") {
    actions.push(
      { label: "Start Rental", newStatus: "active", icon: <Play className="h-4 w-4" />, variant: "default" },
      { label: "Cancel Booking", newStatus: "cancelled", icon: <XCircle className="h-4 w-4" />, variant: "destructive" }
    );
  } else if (status === "active") {
    actions.push(
      { label: "Complete Rental", newStatus: "completed", icon: <CheckCircle className="h-4 w-4" />, variant: "default" }
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => (
        <form
          key={action.newStatus}
          action={updateBookingStatusAction}
        >
          <input type="hidden" name="id" value={bookingId} />
          <input type="hidden" name="status" value={action.newStatus} />
          <Button
            type="submit"
            variant={action.variant || "outline"}
            size="sm"
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        </form>
      ))}
    </div>
  );
}

export default async function BookingDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const result = await getBooking(id);

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
        <p className="text-muted-foreground mb-6">{result.error}</p>
        <Button asChild>
          <Link href="/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const booking = result.data!;
  const config = statusConfig[booking.status] || statusConfig.inquiry;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Booking #{booking.id.slice(0, 8)}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}
              >
                {config.icon}
                {config.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <StatusTimeline currentStatus={booking.status} />
            <StatusActions bookingId={booking.id} status={booking.status} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup Date</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(booking.pickupDate)}
                  </p>
                  {booking.pickupLocation && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.pickupLocation}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Return Date</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(booking.returnDate)}
                  </p>
                  {booking.returnLocation && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.returnLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 p-3 rounded-md bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
            {booking.cancellationReason && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive/70 mb-1">Cancellation Reason</p>
                <p className="text-sm text-destructive">{booking.cancellationReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposit</span>
              <span className="text-sm font-medium">
                {formatCurrency(booking.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposit Paid</span>
              <Badge variant={booking.depositPaid ? "default" : "secondary"}>
                {booking.depositPaid ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fully Paid</span>
              <Badge variant={booking.fullyPaid ? "default" : "secondary"}>
                {booking.fullyPaid ? "Yes" : "No"}
              </Badge>
            </div>

            {booking.payments.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                  Payments
                </p>
                <div className="space-y-2">
                  {booking.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">{payment.type}</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {booking.client.firstName[0]}
                {booking.client.lastName[0]}
              </div>
              <div>
                <Link
                  href={`/clients/${booking.client.id}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {booking.client.firstName} {booking.client.lastName}
                </Link>
                {booking.client.email && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {booking.client.email}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {booking.client.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {booking.client.phone}
                </div>
              )}
              {booking.client.licenseNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  {booking.client.licenseNumber}
                </div>
              )}
              {(booking.client.city || booking.client.country) && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {[booking.client.city, booking.client.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.vehicle.year} &middot; {booking.vehicle.licensePlate}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">
                Category:{" "}
                <span className="font-medium text-foreground capitalize">
                  {booking.vehicle.category}
                </span>
              </div>
              <div className="text-muted-foreground">
                Rate:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(booking.vehicle.dailyRate)}/day
                </span>
              </div>
              <div className="text-muted-foreground">
                Transmission:{" "}
                <span className="font-medium text-foreground capitalize">
                  {booking.vehicle.transmission}
                </span>
              </div>
              <div className="text-muted-foreground">
                Fuel:{" "}
                <span className="font-medium text-foreground capitalize">
                  {booking.vehicle.fuelType}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booking.contract ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Contract #{booking.contract.contractNumber}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Status: {booking.contract.status}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/contracts/${booking.contract.id}`}>View</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No contract has been created for this booking yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
