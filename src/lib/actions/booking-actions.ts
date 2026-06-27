"use server";

import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { daysBetween } from "@/lib/utils";
import { getCurrentAgencyId } from "@/lib/agency";
import { sendWhatsAppNotification } from "@/lib/services/notifications";
import { createContract } from "@/lib/actions/contract-actions";

const statusUpdateSchema = z.object({
  status: z.enum(["inquiry", "confirmed", "active", "completed", "cancelled"]),
});

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getBookings(filters?: {
  status?: string;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const where: Record<string, unknown> = { agencyId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.pickupDate = dateFilter;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: true,
        vehicle: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: serialize(bookings) };
  } catch {
    return { error: "Failed to fetch bookings" };
  }
}

export async function getBooking(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const booking = await prisma.booking.findFirst({
      where: { id, agencyId },
      include: {
        client: true,
        vehicle: true,
        user: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        contract: true,
      },
    });

    if (!booking) return { error: "Booking not found" };
    return { data: serialize(booking) };
  } catch {
    return { error: "Failed to fetch booking" };
  }
}

export async function createBooking(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const validated = bookingSchema.parse(data);

    const pickup = new Date(validated.pickupDate);
    const ret = new Date(validated.returnDate);

    if (ret <= pickup) {
      return { error: "Return date must be after pickup date" };
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        vehicleId: validated.vehicleId,
        status: { notIn: ["cancelled"] },
        AND: [
          { pickupDate: { lt: ret } },
          { returnDate: { gt: pickup } },
        ],
      },
    });

    if (conflicts.length > 0) {
      return { error: "Vehicle is not available for the selected dates" };
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: validated.vehicleId, agencyId },
    });

    if (!vehicle) return { error: "Vehicle not found" };

    const days = daysBetween(pickup, ret);
    const calculatedAmount = validated.totalAmount > 0 ? validated.totalAmount : days * vehicle.dailyRate;

    const booking = await prisma.booking.create({
      data: {
        agencyId,
        vehicleId: validated.vehicleId,
        clientId: validated.clientId,
        userId: session.user.id,
        pickupDate: pickup,
        returnDate: ret,
        pickupLocation: validated.pickupLocation || null,
        returnLocation: validated.returnLocation || null,
        totalAmount: calculatedAmount,
        depositAmount: validated.depositAmount || 0,
        notes: validated.notes || null,
        status: "inquiry",
      },
      include: {
        client: true,
        vehicle: true,
      },
    });

    revalidatePath("/bookings");

    sendWhatsAppNotification({
      type: "booking_created",
      bookingId: booking.id,
      clientName: `${booking.client.firstName} ${booking.client.lastName}`,
      vehicleName: `${booking.vehicle.brand} ${booking.vehicle.model}`,
      pickupDate: pickup.toLocaleDateString(),
      returnDate: ret.toLocaleDateString(),
    });

    createContract(booking.id).catch(() => {});

    return { data: serialize(booking) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to create booking" };
  }
}

export async function updateBooking(id: string, data: unknown) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.booking.findFirst({ where: { id, agencyId } });
    if (!existing) return { error: "Booking not found" };

    const validated = bookingSchema.parse(data);

    const pickup = new Date(validated.pickupDate);
    const ret = new Date(validated.returnDate);

    if (ret <= pickup) {
      return { error: "Return date must be after pickup date" };
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        vehicleId: validated.vehicleId,
        id: { not: id },
        status: { notIn: ["cancelled"] },
        AND: [
          { pickupDate: { lt: ret } },
          { returnDate: { gt: pickup } },
        ],
      },
    });

    if (conflicts.length > 0) {
      return { error: "Vehicle is not available for the selected dates" };
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        vehicleId: validated.vehicleId,
        clientId: validated.clientId,
        pickupDate: pickup,
        returnDate: ret,
        pickupLocation: validated.pickupLocation || null,
        returnLocation: validated.returnLocation || null,
        totalAmount: validated.totalAmount,
        depositAmount: validated.depositAmount || 0,
        notes: validated.notes || null,
      },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${id}`);
    return { data: serialize(booking) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update booking" };
  }
}

export async function deleteBooking(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.booking.findFirst({ where: { id, agencyId } });
    if (!existing) return { error: "Booking not found" };

    await prisma.booking.delete({ where: { id } });
    revalidatePath("/bookings");
    return { success: true };
  } catch {
    return { error: "Failed to delete booking" };
  }
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const validated = statusUpdateSchema.parse({ status });

    const existing = await prisma.booking.findFirst({ where: { id, agencyId } });
    if (!existing) return { error: "Booking not found" };

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: validated.status },
    });

    await prisma.activity.create({
      data: {
        action: `Status changed to ${validated.status}`,
        entity: "booking",
        entityId: id,
        bookingId: id,
        agencyId,
        userId: session.user.id,
      },
    });

    if (validated.status === "confirmed" || validated.status === "active") {
      const fullBooking = await prisma.booking.findFirst({
        where: { id },
        include: { client: true, vehicle: true },
      });
      if (fullBooking) {
        sendWhatsAppNotification(
          validated.status === "confirmed"
            ? {
                type: "booking_confirmed",
                bookingId: id,
                clientName: `${fullBooking.client.firstName} ${fullBooking.client.lastName}`,
              }
            : {
                type: "booking_active",
                bookingId: id,
                clientName: `${fullBooking.client.firstName} ${fullBooking.client.lastName}`,
                vehicleName: `${fullBooking.vehicle.brand} ${fullBooking.vehicle.model}`,
              }
        );
      }
    }

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${id}`);
    return { data: serialize(booking) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update booking status" };
  }
}

export async function updateBookingStatusAction(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  await updateBookingStatus(id, status);
}

export async function checkAvailability(vehicleId: string, pickupDate: string, returnDate: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, agencyId } });
    if (!vehicle) return { error: "Vehicle not found" };

    const pickup = new Date(pickupDate);
    const ret = new Date(returnDate);

    const conflicts = await prisma.booking.findMany({
      where: {
        vehicleId,
        status: { notIn: ["cancelled"] },
        AND: [
          { pickupDate: { lt: ret } },
          { returnDate: { gt: pickup } },
        ],
      },
      include: {
        client: true,
      },
      orderBy: { pickupDate: "asc" },
    });

    return { data: serialize(conflicts) };
  } catch {
    return { error: "Failed to check availability" };
  }
}
