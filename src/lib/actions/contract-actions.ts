"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateContractNumber } from "@/lib/utils";

const contractUpdateSchema = z.object({
  pickupOdometer: z.coerce.number().int().min(0).optional(),
  returnOdometer: z.coerce.number().int().min(0).optional(),
  fuelLevel: z.string().optional(),
  damageNotes: z.string().optional(),
  notes: z.string().optional(),
});

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getContracts(filters?: { status?: string; search?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const where: Record<string, unknown> = { agencyId: user.agencyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { contractNumber: { contains: filters.search } },
        { client: { firstName: { contains: filters.search } } },
        { client: { lastName: { contains: filters.search } } },
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: true,
        booking: {
          include: { vehicle: true },
        },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: serialize(contracts) };
  } catch {
    return { error: "Failed to fetch contracts" };
  }
}

export async function getContract(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const contract = await prisma.contract.findFirst({
      where: { id, agencyId: user.agencyId },
      include: {
        client: true,
        booking: {
          include: { vehicle: true, payments: true },
        },
        user: true,
      },
    });

    if (!contract) return { error: "Contract not found" };
    return { data: serialize(contract) };
  } catch {
    return { error: "Failed to fetch contract" };
  }
}

export async function createContract(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, agencyId: user.agencyId },
      include: { client: true, vehicle: true },
    });

    if (!booking) return { error: "Booking not found" };

    const existing = await prisma.contract.findUnique({ where: { bookingId } });
    if (existing) return { error: "Contract already exists for this booking" };

    const contractNumber = generateContractNumber();

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        bookingId: booking.id,
        clientId: booking.clientId,
        userId: session.user.id,
        agencyId: user.agencyId,
        status: "draft",
      },
      include: {
        client: true,
        booking: {
          include: { vehicle: true },
        },
      },
    });

    revalidatePath("/contracts");
    revalidatePath(`/bookings/${bookingId}`);
    return { data: serialize(contract) };
  } catch {
    return { error: "Failed to create contract" };
  }
}

export async function updateContract(id: string, data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const validated = contractUpdateSchema.parse(data);

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        pickupOdometer: validated.pickupOdometer ?? undefined,
        returnOdometer: validated.returnOdometer ?? undefined,
        fuelLevel: validated.fuelLevel ?? undefined,
        damageNotes: validated.damageNotes ?? undefined,
        notes: validated.notes ?? undefined,
      },
      include: {
        client: true,
        booking: {
          include: { vehicle: true },
        },
      },
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { data: serialize(contract) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update contract" };
  }
}

export async function signContract(id: string, role: "client" | "agency") {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const contract = await prisma.contract.findFirst({
      where: { id, agencyId: user.agencyId },
    });

    if (!contract) return { error: "Contract not found" };

    const updateData: Record<string, unknown> = {};

    if (role === "client") {
      updateData.signedByClient = true;
    } else {
      updateData.signedByAgency = true;
    }

    const bothSigned = contract.signedByClient || role === "client"
      && contract.signedByAgency || role === "agency";

    if (contract.signedByClient && role === "client") {
      return { error: "Contract already signed by client" };
    }
    if (contract.signedByAgency && role === "agency") {
      return { error: "Contract already signed by agency" };
    }

    const newSignedByClient = role === "client" ? true : contract.signedByClient;
    const newSignedByAgency = role === "agency" ? true : contract.signedByAgency;

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        signedByClient: newSignedByClient,
        signedByAgency: newSignedByAgency,
        status: newSignedByClient && newSignedByAgency ? "signed" : "draft",
        signedAt: newSignedByClient && newSignedByAgency ? new Date() : undefined,
        ...(role === "agency" ? {} : {}),
      },
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { data: serialize(updated) };
  } catch {
    return { error: "Failed to sign contract" };
  }
}

export async function deleteContract(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    await prisma.contract.delete({ where: { id } });

    revalidatePath("/contracts");
    return { success: true };
  } catch {
    return { error: "Failed to delete contract" };
  }
}
