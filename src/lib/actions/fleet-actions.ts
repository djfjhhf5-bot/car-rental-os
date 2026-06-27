"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { vehicleSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { getCurrentAgencyId } from "@/lib/agency";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getVehicles(params?: { search?: string; status?: string }) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const where: Record<string, unknown> = { agencyId };

    if (params?.status && params.status !== "all") {
      where.status = params.status;
    }

    if (params?.search) {
      const s = params.search;
      where.OR = [
        { brand: { contains: s } },
        { model: { contains: s } },
        { licensePlate: { contains: s } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: serialize(vehicles) };
  } catch {
    return { success: false, error: "Failed to fetch vehicles" };
  }
}

export async function getVehicle(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { pickupDate: "desc" },
          include: { client: true },
        },
        maintenanceLogs: {
          orderBy: { scheduledDate: "desc" },
        },
      },
    });

    if (!vehicle) return { success: false, error: "Vehicle not found" };
    if (vehicle.agencyId !== agencyId) return { success: false, error: "Vehicle not found" };

    return { success: true, data: serialize(vehicle) };
  } catch {
    return { success: false, error: "Failed to fetch vehicle" };
  }
}

export async function createVehicle(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const validated = vehicleSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const { insuranceExpiry, registrationExpiry, ...rest } = validated.data;

    const vehicle = await prisma.vehicle.create({
      data: {
        ...rest,
        agencyId,
        status: "available",
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
      },
    });

    revalidatePath("/fleet");
    return { success: true, data: vehicle };
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return { success: false, error: "A vehicle with this license plate already exists" };
    }
    return { success: false, error: "Failed to create vehicle" };
  }
}

export async function updateVehicle(id: string, data: unknown) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== agencyId) {
      return { success: false, error: "Vehicle not found" };
    }

    const validated = vehicleSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const { insuranceExpiry, registrationExpiry, ...rest } = validated.data;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...rest,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
      },
    });

    revalidatePath("/fleet");
    revalidatePath(`/fleet/${id}`);
    return { success: true, data: vehicle };
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return { success: false, error: "A vehicle with this license plate already exists" };
    }
    return { success: false, error: "Failed to update vehicle" };
  }
}

export async function deleteVehicle(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== agencyId) {
      return { success: false, error: "Vehicle not found" };
    }

    const bookingCount = await prisma.booking.count({
      where: {
        vehicleId: id,
        status: { in: ["confirmed", "active"] },
      },
    });

    if (bookingCount > 0) {
      return { success: false, error: "Cannot delete vehicle with active bookings" };
    }

    await prisma.vehicle.delete({ where: { id } });

    revalidatePath("/fleet");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete vehicle" };
  }
}

export async function toggleVehiclePublish(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== agencyId) {
      return { success: false, error: "Vehicle not found" };
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { published: !existing.published },
    });

    revalidatePath("/fleet");
    revalidatePath(`/fleet/${id}`);
    return { success: true, data: vehicle };
  } catch {
    return { success: false, error: "Failed to toggle publish status" };
  }
}

export async function updateVehicleStatus(id: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const validStatuses = ["available", "booked", "maintenance", "rented", "inactive"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== agencyId) {
      return { success: false, error: "Vehicle not found" };
    }

    await prisma.vehicle.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/fleet");
    revalidatePath(`/fleet/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}
