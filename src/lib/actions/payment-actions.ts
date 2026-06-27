"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendWhatsAppNotification } from "@/lib/services/notifications";

const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  method: z.string().default("cash"),
  type: z.string().default("deposit"),
  status: z.string().default("paid"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getPayments(filters?: { status?: string; type?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const where: Record<string, unknown> = { agencyId: user.agencyId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: { client: true, vehicle: true },
        },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: serialize(payments) };
  } catch {
    return { error: "Failed to fetch payments" };
  }
}

export async function getPayment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const payment = await prisma.payment.findFirst({
      where: { id, agencyId: user.agencyId },
      include: {
        booking: {
          include: { client: true, vehicle: true },
        },
        user: true,
      },
    });

    if (!payment) return { error: "Payment not found" };
    return { data: serialize(payment) };
  } catch {
    return { error: "Failed to fetch payment" };
  }
}

export async function createPayment(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const validated = paymentSchema.parse(data);

    const booking = await prisma.booking.findFirst({
      where: { id: validated.bookingId, agencyId: user.agencyId },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    if (!booking) return { error: "Booking not found" };

    const payment = await prisma.payment.create({
      data: {
        bookingId: validated.bookingId,
        amount: validated.amount,
        method: validated.method,
        type: validated.type,
        status: validated.status,
        reference: validated.reference || null,
        notes: validated.notes || null,
        paidAt: validated.paidAt ? new Date(validated.paidAt) : new Date(),
        userId: session.user.id,
        agencyId: user.agencyId,
      },
      include: {
        booking: true,
      },
    });

    const allPayments = await prisma.payment.findMany({
      where: { bookingId: validated.bookingId, status: "paid" },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const depositPayments = allPayments.filter((p) => p.type === "deposit");
    const totalDepositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);

    await prisma.booking.update({
      where: { id: validated.bookingId },
      data: {
        depositPaid: totalDepositPaid >= booking.depositAmount,
        fullyPaid: totalPaid >= booking.totalAmount,
      },
    });

    revalidatePath("/payments");
    revalidatePath(`/bookings/${validated.bookingId}`);

    sendWhatsAppNotification({
      type: "payment_received",
      bookingId: validated.bookingId,
      clientName: `${booking.client?.firstName || ""} ${booking.client?.lastName || ""}`.trim() || "Unknown",
      amount: validated.amount,
      method: validated.method,
    });

    return { data: serialize(payment) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to create payment" };
  }
}

export async function deletePayment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const payment = await prisma.payment.findFirst({
      where: { id, agencyId: user.agencyId },
    });

    if (!payment) return { error: "Payment not found" };

    await prisma.payment.delete({ where: { id } });

    const allPayments = await prisma.payment.findMany({
      where: { bookingId: payment.bookingId, status: "paid" },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const booking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
    });

    if (booking) {
      const depositPayments = allPayments.filter((p) => p.type === "deposit");
      const totalDepositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          depositPaid: totalDepositPaid >= booking.depositAmount,
          fullyPaid: totalPaid >= booking.totalAmount,
        },
      });
    }

    revalidatePath("/payments");
    revalidatePath(`/bookings/${payment.bookingId}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete payment" };
  }
}

export async function getBookingPayments(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const payments = await prisma.payment.findMany({
      where: { bookingId, agencyId: user.agencyId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return { data: serialize(payments) };
  } catch {
    return { error: "Failed to fetch booking payments" };
  }
}
