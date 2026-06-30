import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/services/encryption";

export interface SendDmParams {
  to: string;
  message: string;
  agencyId: string;
}

export async function sendDm({ to, message, agencyId }: SendDmParams): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.wassenderConfig.findFirst({
      where: { agencyId, active: true },
    });

    if (!config?.apiKey) {
      return { success: false, error: "Wassender not configured. Go to Settings > WhatsApp." };
    }

    const apiKey = decrypt(config.apiKey);

    const cleanNumber = to.replace(/[^0-9]/g, "");
    const number = cleanNumber.startsWith("213") ? cleanNumber : `213${cleanNumber.replace(/^0/, "")}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ to: number, text: message }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: data.error || `Wassender API error (${res.status})` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function getPhaseMessage(phase: string, leadName: string, companyName: string): string {
  const greeting = `👋 *${companyName}*`;

  switch (phase) {
    case "inquiry":
      return `${greeting}\n\nHello ${leadName}! 👋\n\nThank you for your interest in renting a car from us. Here are our available vehicles:\n\n🚗 Economy cars from DZD 3,500/day\n🚙 SUVs from DZD 10,000/day\n🚘 Luxury cars from DZD 18,000/day\n\nWhich category interests you? Let me know if you have any questions!`;
    case "quoted":
      return `${greeting}\n\nHi ${leadName},\n\nI hope the quote I sent you was helpful! 😊\n\nDo you have any questions about the pricing or vehicle? I'm happy to adjust the offer based on your needs. Also, we offer discounts for weekly and monthly rentals!`;
    case "follow-up":
      return `${greeting}\n\nHi ${leadName},\n\nJust checking in — have you had a chance to think about the rental? 🚗\n\nWe currently have a special offer: *free additional driver* and *10% discount* on weekly bookings if you confirm by the end of this week!\n\nLet me know if you'd like to proceed.`;
    case "booked":
      return `${greeting}\n\nHi ${leadName}, 🎉\n\nYour booking has been confirmed! Here's what's next:\n\n✅ We're preparing your vehicle\n📋 Contract will be ready at pickup\n🚗 Vehicle will be cleaned and inspected\n\nPlease arrive with your driver's license and ID card. See you soon!`;
    case "client":
      return `${greeting}\n\nHi ${leadName}, 🌟\n\nAs one of our valued returning clients, we'd like to offer you an *exclusive loyalty discount* on your next rental!\n\nWould you like to check out our latest additions to the fleet? We have some great new vehicles that you might enjoy.`;
    case "returned":
      return `${greeting}\n\nHi ${leadName}, 🙏\n\nThank you for renting with us! We hope you had a great experience.\n\nCould you take a moment to leave us a review? It helps us improve and serve you better.\n\nAlso, if you know anyone who needs a rental car, we'd appreciate a referral! 🚗✨`;
    default:
      return `${greeting}\n\nHello ${leadName}, this is ${companyName}. How can we help you today?`;
  }
}

export async function getWasenderStatus(agencyId: string): Promise<{ configured: boolean; active: boolean }> {
  const config = await prisma.wassenderConfig.findFirst({
    where: { agencyId },
  });

  return {
    configured: !!config?.apiKey,
    active: config?.active || false,
  };
}
