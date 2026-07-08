"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/services/encryption";
import type { LlmConfig } from "@/lib/services/llm";

export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  context: string | null;
  createdAt: Date;
  userId: string;
};

export type VehicleInfo = {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
  depositAmount: number;
  status: string;
  imageUrl: string | null;
  published: boolean;
};

export type AgencyContext = {
  fleetSummary: {
    total: number;
    available: number;
    booked: number;
    maintenance: number;
  };
  vehicles: VehicleInfo[];
  activeBookings: number;
  totalClients: number;
  revenueThisMonth: number;
  totalRevenue: number;
  recentBookingsCount: number;
  popularCategories: { category: string; count: number }[];
  currency: string;
  agencyName: string;
  carsPageUrl: string;
};

export async function getChatHistory(): Promise<{
  success: boolean;
  data?: ChatMessage[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agencyId: true },
    });

    if (!user?.agencyId) return { success: false, error: "No agency found" };

    const messages = await prisma.chatMessage.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      data: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        context: m.context,
        createdAt: m.createdAt,
        userId: m.userId,
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch chat history" };
  }
}

export async function saveChatMessage(
  role: string,
  content: string,
  context?: string,
  agencySlug?: string
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  try {
    const resolved = await resolveAgency(agencySlug);
    if (!resolved.success) return { success: false, error: resolved.error };
    const agencyId = resolved.agencyId;

    let userId = "public";
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;

    const message = await prisma.chatMessage.create({
      data: {
        agencyId,
        userId,
        role,
        content,
        context: context || null,
      },
    });

    return {
      success: true,
      data: {
        id: message.id,
        role: message.role,
        content: message.content,
        context: message.context,
        createdAt: message.createdAt,
        userId: message.userId,
      },
    };
  } catch {
    return { success: false, error: "Failed to save chat message" };
  }
}

export async function clearChatHistory(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agencyId: true },
    });

    if (!user?.agencyId) return { success: false, error: "No agency found" };

    await prisma.chatMessage.deleteMany({
      where: { agencyId: user.agencyId },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to clear chat history" };
  }
}

async function resolveAgency(agencySlug?: string) {
  if (agencySlug) {
    const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!agency) return { success: false as const, error: "Agency not found" };
    return { success: true as const, agencyId: agency.id };
  }
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user?.agencyId) return { success: false as const, error: "No agency found" };
  return { success: true as const, agencyId: user.agencyId };
}

export async function getAgencyContext(agencySlug?: string): Promise<{
  success: boolean;
  data?: AgencyContext;
  error?: string;
}> {
  try {
    const resolved = await resolveAgency(agencySlug);
    if (!resolved.success) return { success: false, error: resolved.error };

    const agencyId = resolved.agencyId;

    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    const vehicles = await prisma.vehicle.findMany({ where: { agencyId } });
    const bookings = await prisma.booking.findMany({ where: { agencyId } });
    const clients = await prisma.client.findMany({ where: { agencyId } });
    const payments = await prisma.payment.findMany({ where: { agencyId } });

    if (!agency) return { success: false, error: "Agency not found" };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayments = payments.filter(
      (p) => p.paidAt && new Date(p.paidAt) >= startOfMonth
    );

    const categoryCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
    });
    const popularCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        fleetSummary: {
          total: vehicles.length,
          available: vehicles.filter((v) => v.status === "available").length,
          booked: vehicles.filter(
            (v) => v.status === "booked" || v.status === "rented"
          ).length,
          maintenance: vehicles.filter((v) => v.status === "maintenance").length,
        },
        vehicles: vehicles.map((v) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          category: v.category,
          transmission: v.transmission,
          fuelType: v.fuelType,
          seats: v.seats,
          dailyRate: v.dailyRate,
          weeklyRate: v.weeklyRate,
          monthlyRate: v.monthlyRate,
          depositAmount: v.depositAmount,
          status: v.status,
          imageUrl: v.imageUrl,
          published: v.published,
        })),
        activeBookings: bookings.filter(
          (b) => b.status === "active" || b.status === "confirmed"
        ).length,
        totalClients: clients.length,
        revenueThisMonth: thisMonthPayments.reduce(
          (sum, p) => sum + p.amount,
          0
        ),
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        recentBookingsCount: bookings.filter(
          (b) => new Date(b.createdAt) >= startOfMonth
        ).length,
        popularCategories,
        currency: agency.currency,
        agencyName: agency.name,
        carsPageUrl: agency.slug ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent?agency=${agency.slug}` : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent`,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch agency context" };
  }
}

export async function getActiveLlmConfig(agencySlug?: string, purpose: string = "admin"): Promise<{
  success: boolean;
  data?: LlmConfig;
  error?: string;
}> {
  try {
    const resolved = await resolveAgency(agencySlug);
    if (!resolved.success) return { success: false, error: resolved.error };

    const agencyId = resolved.agencyId;

    const config = await prisma.llmConfig.findFirst({
      where: { agencyId, purpose },
    });

    if (!config) {
      return { success: false, error: "No active LLM configuration found" };
    }

    return {
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        apiKey: config.apiKey ? decrypt(config.apiKey) : null,
        model: config.model,
        apiUrl: config.apiUrl,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch LLM config" };
  }
}
