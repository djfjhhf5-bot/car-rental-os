import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/services/encryption";

type NotificationEvent =
  | { type: "booking_created"; bookingId: string; clientName: string; vehicleName: string; pickupDate: string; returnDate: string }
  | { type: "booking_confirmed"; bookingId: string; clientName: string }
  | { type: "payment_received"; bookingId: string; clientName: string; amount: number; method: string }
  | { type: "booking_active"; bookingId: string; clientName: string; vehicleName: string };

function formatMessage(event: NotificationEvent): string {
  switch (event.type) {
    case "booking_created":
      return `\u{1F514} *New Booking Inquiry*\n\nClient: ${event.clientName}\nVehicle: ${event.vehicleName}\nPickup: ${event.pickupDate}\nReturn: ${event.returnDate}\n\nView: ${process.env.NEXTAUTH_URL}/bookings/${event.bookingId}`;
    case "booking_confirmed":
      return `\u{2705} *Booking Confirmed*\n\nClient: ${event.clientName}\nBooking: #${event.bookingId.slice(0, 8)}\n\nView: ${process.env.NEXTAUTH_URL}/bookings/${event.bookingId}`;
    case "payment_received":
      return `\u{1F4B0} *Payment Received*\n\nClient: ${event.clientName}\nAmount: $${event.amount.toFixed(2)}\nMethod: ${event.method.replace("_", " ")}\nBooking: #${event.bookingId.slice(0, 8)}`;
    case "booking_active":
      return `\u{1F697} *Booking Active*\n\nClient: ${event.clientName}\nVehicle: ${event.vehicleName}\nBooking: #${event.bookingId.slice(0, 8)}\n\nThe rental is now in progress.`;
  }
}

export async function sendWhatsAppNotification(event: NotificationEvent): Promise<void> {
  try {
    const config = await prisma.wassenderConfig.findFirst({
      where: { active: true },
      include: { agency: { select: { phone: true } } },
    });

    if (!config?.apiKey || !config?.sessionId || !config?.agency?.phone) return;

    const apiKey = decrypt(config.apiKey);
    const message = formatMessage(event);

    await fetch("https://wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ to: `213${config.agency.phone}`, text: message }),
    });
  } catch {
    // Fail silently
  }
}
