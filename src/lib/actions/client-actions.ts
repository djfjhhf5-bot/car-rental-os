"use server";

import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCurrentAgencyId } from "@/lib/agency";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getClients(search?: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const where: Record<string, unknown> = { agencyId };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: serialize(clients) };
  } catch {
    return { error: "Failed to fetch clients" };
  }
}

export async function getClient(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const client = await prisma.client.findFirst({
      where: { id, agencyId },
      include: {
        bookings: {
          include: { vehicle: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { bookings: true } },
      },
    });

    if (!client) return { error: "Client not found" };
    return { data: serialize(client) };
  } catch {
    return { error: "Failed to fetch client" };
  }
}

export async function createClient(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const validated = clientSchema.parse(data);
    const client = await prisma.client.create({
      data: {
        agencyId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        whatsapp: validated.whatsapp || null,
        address: validated.address || null,
        city: validated.city || null,
        country: validated.country || null,
        licenseNumber: validated.licenseNumber || null,
        licenseExpiry: validated.licenseExpiry ? new Date(validated.licenseExpiry) : null,
        idNumber: validated.idNumber || null,
        notes: validated.notes || null,
      },
    });
    revalidatePath("/clients");
    return { data: serialize(client) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to create client" };
  }
}

export async function updateClient(id: string, data: unknown) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.client.findFirst({ where: { id, agencyId } });
    if (!existing) return { error: "Client not found" };

    const validated = clientSchema.parse(data);
    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        whatsapp: validated.whatsapp || null,
        address: validated.address || null,
        city: validated.city || null,
        country: validated.country || null,
        licenseNumber: validated.licenseNumber || null,
        licenseExpiry: validated.licenseExpiry ? new Date(validated.licenseExpiry) : null,
        idNumber: validated.idNumber || null,
        notes: validated.notes || null,
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { data: serialize(client) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const agencyId = await getCurrentAgencyId();

    const existing = await prisma.client.findFirst({
      where: { id, agencyId },
      include: { _count: { select: { bookings: true, contracts: true } } },
    });
    if (!existing) return { error: "Client not found" };

    if (existing._count.bookings > 0 || existing._count.contracts > 0) {
      return { error: "Cannot delete client with existing bookings or contracts. Cancel related bookings first." };
    }

    await prisma.activity.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Failed to delete client. Please try again." };
  }
}
