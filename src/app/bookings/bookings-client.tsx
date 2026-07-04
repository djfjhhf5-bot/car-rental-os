"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Car,
  User,
  Check,
  X,
  Play,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import { updateBookingStatusAction } from "@/lib/actions/booking-actions";

const statusColors: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  active: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusActions({ bookingId, status, lang }: { bookingId: string; status: string; lang: "en" | "fr" | "ar" }) {
  const actions: Array<{
    label: string;
    newStatus: string;
    icon: React.ReactNode;
    variant?: "default" | "outline" | "ghost" | "destructive";
  }> = [];

  if (status === "inquiry") {
    actions.push({
      label: t("bookings.confirm", lang),
      newStatus: "confirmed",
      icon: <Check className="h-3.5 w-3.5" />,
      variant: "default",
    });
    actions.push({
      label: t("bookings.cancel", lang),
      newStatus: "cancelled",
      icon: <X className="h-3.5 w-3.5" />,
      variant: "destructive",
    });
  } else if (status === "confirmed") {
    actions.push({
      label: t("bookings.startRental", lang),
      newStatus: "active",
      icon: <Play className="h-3.5 w-3.5" />,
      variant: "default",
    });
    actions.push({
      label: t("bookings.cancel", lang),
      newStatus: "cancelled",
      icon: <X className="h-3.5 w-3.5" />,
      variant: "destructive",
    });
  } else if (status === "active") {
    actions.push({
      label: t("bookings.complete", lang),
      newStatus: "completed",
      icon: <Check className="h-3.5 w-3.5" />,
      variant: "default",
    });
  }

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <form key={action.newStatus} action={updateBookingStatusAction}>
          <input type="hidden" name="id" value={bookingId} />
          <input type="hidden" name="status" value={action.newStatus} />
          <Button
            type="submit"
            variant={action.variant || "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
          >
            {action.icon}
            {action.label}
          </Button>
        </form>
      ))}
    </div>
  );
}

export default function BookingsClient({
  bookings,
  paramsStatus,
  paramsDateFrom,
  paramsDateTo,
  error,
}: {
  bookings: any[];
  paramsStatus?: string;
  paramsDateFrom?: string;
  paramsDateTo?: string;
  error?: string | null;
}) {
  const { lang } = useLanguage();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <Calendar className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t("bookings.loadError", lang)}</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/bookings">{t("common.tryAgain", lang)}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("bookings.title", lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {t("bookings.subtitle", lang)}
          </p>
        </div>
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("bookings.newBooking", lang)}
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">{t("bookings.status", lang)}</label>
              <Select name="status" defaultValue={paramsStatus || ""}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.allStatuses", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allStatuses", lang)}</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-1 block">{t("bookings.from", lang)}</label>
              <Input
                type="date"
                name="dateFrom"
                defaultValue={paramsDateFrom || ""}
              />
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-1 block">{t("bookings.to", lang)}</label>
              <Input
                type="date"
                name="dateTo"
                defaultValue={paramsDateTo || ""}
              />
            </div>
            <Button type="submit" variant="secondary">
              {t("bookings.applyFilters", lang)}
            </Button>
          </form>
        </CardContent>
      </Card>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {paramsStatus ? t("bookings.noResults", lang) : t("bookings.noBookings", lang)}
          </h2>
          <p className="text-muted-foreground mb-6">
            {paramsStatus
              ? t("bookings.noResultsDesc", lang)
              : t("bookings.noBookingsDesc", lang)}
          </p>
          {!paramsStatus && (
            <Button asChild>
              <Link href="/bookings/new">
                <Plus className="h-4 w-4 mr-2" />
                {t("bookings.newBooking", lang)}
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
                      {t("bookings.bookingId", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.client", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.vehicle", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.pickup", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.return", lang)}
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.amount", lang)}
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("bookings.status", lang)}
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("common.actions", lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: any) => (
                    <tr
                      key={booking.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-sm font-mono font-medium hover:text-primary transition-colors"
                        >
                          #{booking.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/clients/${booking.clientId}`}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {booking.client.firstName} {booking.client.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          {booking.vehicle.brand} {booking.vehicle.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(booking.pickupDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(booking.returnDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status] || ""}`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/bookings/${booking.id}`}>
                              {t("common.view", lang)}
                            </Link>
                          </Button>
                          <StatusActions
                            bookingId={booking.id}
                            status={booking.status}
                            lang={lang}
                          />
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
    </div>
  );
}
