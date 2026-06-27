"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().default("service"),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  provider: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("pending"),
});

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getMaintenanceRecords(filters?: { status?: string; vehicleId?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const where: Record<string, unknown> = { agencyId: user.agencyId };

    if (filters?.status) where.status = filters.status;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;

    const records = await prisma.maintenance.findMany({
      where,
      include: { vehicle: true },
      orderBy: { scheduledDate: "desc" },
    });

    return { data: serialize(records) };
  } catch {
    return { error: "Failed to fetch maintenance records" };
  }
}

export async function getMaintenanceRecord(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const record = await prisma.maintenance.findFirst({
      where: { id, agencyId: user.agencyId },
      include: { vehicle: true },
    });

    if (!record) return { error: "Maintenance record not found" };
    return { data: serialize(record) };
  } catch {
    return { error: "Failed to fetch maintenance record" };
  }
}

export async function createMaintenanceRecord(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const validated = maintenanceSchema.parse(data);

    const record = await prisma.maintenance.create({
      data: {
        vehicleId: validated.vehicleId,
        type: validated.type,
        description: validated.description || null,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
        completedDate: validated.completedDate ? new Date(validated.completedDate) : null,
        mileage: validated.mileage ?? null,
        cost: validated.cost ?? null,
        provider: validated.provider || null,
        notes: validated.notes || null,
        status: validated.status,
        agencyId: user.agencyId,
      },
      include: { vehicle: true },
    });

    if (validated.status === "in_progress") {
      await prisma.vehicle.update({
        where: { id: validated.vehicleId },
        data: { status: "maintenance" },
      });
    }

    if (validated.status === "completed") {
      const hasActive = await prisma.maintenance.findFirst({
        where: {
          vehicleId: validated.vehicleId,
          status: { in: ["pending", "in_progress"] },
          id: { not: record.id },
        },
      });
      if (!hasActive) {
        await prisma.vehicle.update({
          where: { id: validated.vehicleId },
          data: { status: "available" },
        });
      }
    }

    revalidatePath("/maintenance");
    return { data: serialize(record) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to create maintenance record" };
  }
}

export async function updateMaintenanceRecord(id: string, data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const validated = maintenanceSchema.parse(data);

    const existing = await prisma.maintenance.findFirst({
      where: { id, agencyId: user.agencyId },
    });
    if (!existing) return { error: "Maintenance record not found" };

    const record = await prisma.maintenance.update({
      where: { id },
      data: {
        vehicleId: validated.vehicleId,
        type: validated.type,
        description: validated.description || null,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
        completedDate: validated.completedDate ? new Date(validated.completedDate) : null,
        mileage: validated.mileage ?? null,
        cost: validated.cost ?? null,
        provider: validated.provider || null,
        notes: validated.notes || null,
        status: validated.status,
      },
      include: { vehicle: true },
    });

    if (validated.status === "in_progress" && existing.status !== "in_progress") {
      await prisma.vehicle.update({
        where: { id: validated.vehicleId },
        data: { status: "maintenance" },
      });
    }

    if (validated.status === "completed") {
      const hasActive = await prisma.maintenance.findFirst({
        where: {
          vehicleId: validated.vehicleId,
          status: { in: ["pending", "in_progress"] },
          id: { not: id },
        },
      });
      if (!hasActive) {
        await prisma.vehicle.update({
          where: { id: validated.vehicleId },
          data: { status: "available" },
        });
      }
    }

    revalidatePath("/maintenance");
    revalidatePath(`/maintenance/${id}`);
    return { data: serialize(record) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update maintenance record" };
  }
}

export async function deleteMaintenanceRecord(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    await prisma.maintenance.delete({ where: { id } });

    revalidatePath("/maintenance");
    return { success: true };
  } catch {
    return { error: "Failed to delete maintenance record" };
  }
}

export async function getUpcomingMaintenance() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming = await prisma.maintenance.findMany({
      where: {
        agencyId: user.agencyId,
        status: "pending",
        scheduledDate: { lte: thirtyDays, gte: now },
      },
      include: { vehicle: true },
      orderBy: { scheduledDate: "asc" },
    });

    const overdue = await prisma.maintenance.findMany({
      where: {
        agencyId: user.agencyId,
        status: { in: ["pending", "in_progress"] },
        scheduledDate: { lt: now },
      },
      include: { vehicle: true },
      orderBy: { scheduledDate: "asc" },
    });

    const vehiclesDue = await prisma.vehicle.findMany({
      where: {
        agencyId: user.agencyId,
        status: { not: "inactive" },
        serviceInterval: { not: null },
        lastServiceMileage: { not: null },
      },
    });

    return {
      data: serialize({
        upcoming,
        overdue,
        vehiclesDue: vehiclesDue.filter((v) => {
          if (!v.serviceInterval || !v.lastServiceMileage) return false;
          return v.lastServiceMileage + v.serviceInterval <= (v.lastServiceMileage + v.serviceInterval);
        }),
      }),
    };
  } catch {
    return { error: "Failed to fetch upcoming maintenance" };
  }
}
