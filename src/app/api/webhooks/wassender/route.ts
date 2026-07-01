import { NextRequest } from "next/server";
import { queryLlm, getLlmConfig, type ChatMessage } from "@/lib/services/llm";
import { decrypt } from "@/lib/services/encryption";
import type { AgencyContext, VehicleInfo } from "@/lib/actions/chat-actions";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200";

let fleetCache: { data: AgencyContext | null; expiresAt: number } = { data: null, expiresAt: 0 };

async function getFleetContext(agencyId: string, agencySlug?: string): Promise<AgencyContext> {
  const now = Date.now();
  if (fleetCache.data && now < fleetCache.expiresAt) return fleetCache.data;

  const { prisma } = await import("@/lib/prisma");
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId, published: true },
    select: { brand: true, model: true, year: true, category: true, transmission: true, fuelType: true, seats: true, dailyRate: true, weeklyRate: true, monthlyRate: true, depositAmount: true, status: true, imageUrl: true, published: true, id: true },
  });

  const popularCategories: { category: string; count: number }[] = [];
  const counts: Record<string, number> = {};
  vehicles.forEach((v) => { counts[v.category] = (counts[v.category] || 0) + 1; });
  for (const [category, count] of Object.entries(counts)) popularCategories.push({ category, count });
  popularCategories.sort((a, b) => b.count - a.count);

  const ctx: AgencyContext = {
    fleetSummary: { total: vehicles.length, available: vehicles.filter(v => v.status === "available").length, booked: vehicles.filter(v => v.status === "booked" || v.status === "rented").length, maintenance: vehicles.filter(v => v.status === "maintenance").length },
    vehicles: vehicles as VehicleInfo[],
    activeBookings: 0, totalClients: 0, revenueThisMonth: 0, totalRevenue: 0, recentBookingsCount: 0,
    popularCategories, currency: agency?.currency || "DZD", agencyName: agency?.name || "Car Rental Agency",
    carsPageUrl: agencySlug ? `${APP_URL()}/rent?agency=${agencySlug}` : `${APP_URL()}/rent`,
  };

  fleetCache = { data: ctx, expiresAt: now + 300_000 };
  return ctx;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-webhook-signature");
    const secret = signature || request.nextUrl.searchParams.get("secret") || body?.secret;
    if (!secret) return Response.json({ success: false, error: "Missing webhook secret" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");
    const config = await prisma.wassenderConfig.findFirst({
      where: { webhookSecret: secret, active: true },
      include: { agency: true },
    });
    if (!config) return Response.json({ success: false, error: "Invalid webhook secret" }, { status: 401 });
    if (signature && config.webhookSecret && signature !== config.webhookSecret)
      return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });

    const rawMessages = body?.data?.messages;
    const msg = Array.isArray(rawMessages) ? rawMessages[0] : rawMessages;
    if (msg?.key?.fromMe) return Response.json({ success: true, data: { ignored: true, reason: "Outgoing" } });

    const from = msg?.key?.remoteJid || msg?.key?.cleanedSenderPn || "";
    const text = msg?.messageBody || msg?.message?.conversation || "";
    const messageId = msg?.key?.id || "";
    if (!from || !text) return Response.json({ success: true, data: { ignored: true, reason: "No content" } });

    const digits = from.replace(/[^0-9]/g, "");
    const agencyId = config.agencyId;
    const agencySlug = config.agency?.slug || undefined;

    const lead = await prisma.lead.findFirst({
      where: { agencyId },
      select: { id: true, name: true, phone: true, whatsapp: true, phase: true, source: true, notes: true },
    });

    const matchLead = (l: typeof lead) => {
      if (!l) return false;
      const p = (l.phone || l.whatsapp || "").replace(/[^0-9]/g, "");
      return p.includes(digits) || digits.includes(p) || p.slice(-9) === digits.slice(-9);
    };
    const matchedLead = lead && matchLead(lead) ? lead : null;

    if (matchedLead) {
      await prisma.lead.update({ where: { id: matchedLead.id }, data: { phase: "follow-up" } });
    }

    const conversation = await prisma.conversation.upsert({
      where: { phoneNumber_agencyId: { phoneNumber: digits, agencyId } },
      create: { phoneNumber: digits, agencyId, leadId: matchedLead?.id || null, messages: [], lastMessageId: messageId, messageCount: 0, pendingReply: null, retryCount: 0 },
      update: {},
    });

    if (conversation.lastMessageId === messageId) {
      return Response.json({ success: true, data: { ignored: true, reason: "Duplicate" } });
    }

    const messages = (conversation.messages as Array<{ role: string; content: string; timestamp: number }>) || [];
    messages.push({ role: "user", content: text, timestamp: Date.now() });
    const recentMessages = messages.slice(-20);

    await prisma.activity.create({
      data: { action: "whatsapp_inbound", entity: "lead", details: `Inbound from ${digits}: ${text.slice(0, 500)}`, agencyId: config.agencyId },
    });

    let replied = false;
    const pendingReply = conversation.pendingReply as string | null;
    const retryCount = conversation.retryCount || 0;

    const trySend = async (replyText: string, targetPhone: string): Promise<boolean> => {
      try {
        const apiKey = decrypt(config.apiKey || "");
        const res = await fetch("https://wasenderapi.com/api/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ to: targetPhone, text: replyText }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 429 || errBody.includes("rate limit") || errBody.includes("trial")) {
            return false;
          }
          console.error("Wassender send error:", res.status, errBody.slice(0, 200));
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    const sendWithRetry = async (replyText: string, targetPhone: string): Promise<boolean> => {
      const sent = await trySend(replyText, targetPhone);
      if (!sent) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { pendingReply: replyText, retryCount: retryCount + 1, lastMessageId: messageId, messages: recentMessages, messageCount: recentMessages.length, updatedAt: new Date() },
        });
      }
      return sent;
    };

    if (pendingReply) {
      const sent = await trySend(pendingReply, from);
      if (sent) {
        recentMessages.push({ role: "assistant", content: pendingReply, timestamp: Date.now() });
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { pendingReply: null, retryCount: 0, messages: recentMessages, messageCount: recentMessages.length, lastMessageId: messageId, updatedAt: new Date() },
        });
      }
    }

    const fleetCtx = await getFleetContext(agencyId, agencySlug);
    const llmResult = await getLlmConfig(agencyId);
    let replyText = "";

    if (llmResult.success && llmResult.data) {
      const apiKey = decrypt(llmResult.data.apiKey || "");
      const chatHistory: ChatMessage[] = recentMessages.slice(-10).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const leadContext = matchedLead ? {
        name: matchedLead.name,
        phase: matchedLead.phase,
        source: matchedLead.source || undefined,
        notes: matchedLead.notes || undefined,
      } : null;

      const aiResult = await queryLlm(chatHistory, fleetCtx, { ...llmResult.data, apiKey }, text, "public", leadContext);
      if (aiResult.success && aiResult.data) replyText = aiResult.data;
    }

    if (!replyText) {
      replyText = `Hi! 👋\n\nThank you for your message. Browse our available cars here: ${fleetCtx.carsPageUrl}\n- ${fleetCtx.agencyName}`;
    }

    const sent = await sendWithRetry(replyText, from);
    if (sent) {
      replied = true;
      recentMessages.push({ role: "assistant", content: replyText, timestamp: Date.now() });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { messages: recentMessages, messageCount: recentMessages.length, lastMessageId: messageId, retryCount: 0, pendingReply: null, updatedAt: new Date() },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageId: messageId, messages: recentMessages, messageCount: recentMessages.length, updatedAt: new Date() },
      });
    }

    return Response.json({ success: true, data: { received: true, replied } });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
