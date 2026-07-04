import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBookings } from "@/lib/actions/booking-actions";
import BookingsClient from "./bookings-client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const result = await getBookings({
    status: params.status || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  });

  const bookings = result.data || [];
  const error = result.error || null;

  return (
    <BookingsClient
      bookings={bookings}
      paramsStatus={params.status}
      paramsDateFrom={params.dateFrom}
      paramsDateTo={params.dateTo}
      error={error}
    />
  );
}
