import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/bookings/booking-form";
import { getCurrentAgencyId } from "@/lib/agency";

export default async function NewBookingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const agencyId = await getCurrentAgencyId();

  const [vehicles, clients] = await Promise.all([
    prisma.vehicle.findMany({
      where: { agencyId },
      orderBy: { brand: "asc" },
    }),
    prisma.client.findMany({
      where: { agencyId },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (vehicles.length === 0 || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Cannot Create Booking</h2>
        <p className="text-muted-foreground mb-6">
          {vehicles.length === 0 && clients.length === 0
            ? "You need at least one vehicle and one client to create a booking."
            : vehicles.length === 0
              ? "You need at least one vehicle in the fleet to create a booking."
              : "You need at least one client to create a booking."}
        </p>
      </div>
    );
  }

  return (
    <BookingForm
      vehicles={vehicles}
      clients={clients}
    />
  );
}
