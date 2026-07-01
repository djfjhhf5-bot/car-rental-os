import { NextRequest } from "next/server";
import { queryLlm, getLlmConfig } from "@/lib/services/llm";
import { decrypt } from "@/lib/services/encryption";
import type { AgencyContext, VehicleInfo } from "@/lib/actions/chat-actions";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return Response.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const signature = request.headers.get("x-webhook-signature");
    const secret = signature || request.nextUrl.searchParams.get("secret") || body?.secret;

    if (!secret) {
      return Response.json({ success: false, error: "Missing webhook secret" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");

    const config = await prisma.wassenderConfig.findFirst({
      where: { webhookSecret: secret, active: true },
      include: { agency: true },
    });

    if (!config) {
      return Response.json({ success: false, error: "Invalid or inactive webhook secret" }, { status: 401 });
    }

    if (signature && config.webhookSecret && signature !== config.webhookSecret) {
      return Response.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
    }

    const rawMessages = body?.data?.messages;
    const msg = Array.isArray(rawMessages) ? rawMessages[0] : rawMessages;
    if (msg?.key?.fromMe) {
      return Response.json({ success: true, data: { ignored: true, reason: "Outgoing message" } });
    }
    const from = msg?.key?.remoteJid || msg?.key?.cleanedSenderPn || "";
    const text = msg?.messageBody || msg?.message?.conversation || "";

    if (!from || !text) {
      return Response.json({ success: true, data: { ignored: true, reason: "No message content" } });
    }

    await prisma.activity.create({
      data: {
        action: "whatsapp_inbound",
        entity: "lead",
        details: `Inbound from ${from}: ${text.slice(0, 500)}`,
        agencyId: config.agencyId,
      },
    });

    const digits = from.replace(/[^0-9]/g, "");

    const leads = await prisma.lead.findMany({
      where: { agencyId: config.agencyId },
      select: { id: true, name: true, phone: true, whatsapp: true, phase: true },
    });

    const matchedLead = leads.find((l) => {
      const p = (l.phone || l.whatsapp || "").replace(/[^0-9]/g, "");
      return p.includes(digits) || digits.includes(p) || p.slice(-9) === digits.slice(-9);
    });

    if (matchedLead) {
      await prisma.lead.update({
        where: { id: matchedLead.id },
        data: { phase: "follow-up" },
      });
    }

    const llmResult = await getLlmConfig(config.agencyId);
    let replyText = "";

    if (llmResult.success && llmResult.data) {
      const apiKey = decrypt(llmResult.data.apiKey || "");
      const agencyCtx = await buildAgencyContext(config.agencyId);
      const aiResult = await queryLlm([], agencyCtx, { ...llmResult.data, apiKey }, text, "public");

      if (aiResult.success && aiResult.data) {
        replyText = aiResult.data;
      }
    }

    if (!replyText) {
      const carsUrl = config.agency?.slug
        ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent?agency=${config.agency.slug}`
        : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent`;
      replyText = `Hi! 👋\n\nThank you for your message. Browse our available cars here: ${carsUrl}\n- ${config.agency.name || "The Team"}`;
    }

    try {
      const apiKey = decrypt(config.apiKey || "");
      await fetch("https://wasenderapi.com/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ to: from, text: replyText }),
      });
    } catch (sendErr) {
      console.error("Failed to send reply via Wassender:", sendErr);
    }

    return Response.json({ success: true, data: { received: true, replied: true } });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function buildAgencyContext(agencyId: string): Promise<AgencyContext> {
  const { prisma } = await import("@/lib/prisma");

  const [agency, vehicles, bookings, clients, payments] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    prisma.vehicle.findMany({ where: { agencyId } }),
    prisma.booking.findMany({ where: { agencyId } }),
    prisma.client.findMany({ where: { agencyId } }),
    prisma.payment.findMany({ where: { agencyId } }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPayments = payments.filter((p) => p.paidAt && new Date(p.paidAt) >= startOfMonth);

  const categoryCounts: Record<string, number> = {};
  vehicles.forEach((v) => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  });
  const popularCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    fleetSummary: {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === "available").length,
      booked: vehicles.filter((v) => v.status === "booked" || v.status === "rented").length,
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
    activeBookings: bookings.filter((b) => b.status === "active" || b.status === "confirmed").length,
    totalClients: clients.length,
    revenueThisMonth: thisMonthPayments.reduce((sum, p) => sum + p.amount, 0),
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    recentBookingsCount: bookings.filter((b) => new Date(b.createdAt) >= startOfMonth).length,
    popularCategories,
    currency: agency?.currency || "DZD",
    agencyName: agency?.name || "Car Rental Agency",
    carsPageUrl: agency?.slug ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent?agency=${agency.slug}` : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent`,
  };
}
