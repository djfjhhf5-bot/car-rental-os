import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/services/encryption";
import { queryLlm } from "@/lib/services/llm";
import type { AgencyContext } from "@/lib/actions/chat-actions";

export async function POST(request: NextRequest) {
  try {
    const { agency: agencySlug, messages, message, car } = await request.json();

    if (!agencySlug) {
      return Response.json(
        { success: false, error: "Missing 'agency' parameter" },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { slug: agencySlug },
    });

    if (!agency) {
      return Response.json(
        { success: false, error: "Agency not found" },
        { status: 404 }
      );
    }

    // Save a lead when a user sends a message about a car
    if (car && message) {
      const vehicleRef = `${car.brand} ${car.model} (${car.year})`;
      await prisma.lead.create({
        data: {
          name: "Store Visitor",
          phone: "(pending)",
          source: "chat",
          phase: "inquiry",
          status: "new",
          vehicleRequested: vehicleRef,
          notes: message.substring(0, 500),
          agencyId: agency.id,
        },
      }).catch((e) => {
        console.error("Failed to save lead from chat:", e);
      });
    }

    const [vehicles, llmConfig] = await Promise.all([
      prisma.vehicle.findMany({ where: { agencyId: agency.id } }),
      prisma.llmConfig.findFirst({
        where: { agencyId: agency.id, active: true },
      }),
    ]);

    if (!llmConfig) {
      const availableVehicles = vehicles
        .filter((v) => v.published)
        .map(
          (v) =>
            `${v.brand} ${v.model} (${v.year}) — ${agency.currency} ${v.dailyRate.toLocaleString()}/day`
        )
        .join("\n");

      return Response.json({
        success: true,
        data: `Welcome to ${agency.name}! Here are our available cars:\n\n${availableVehicles || "No cars available at the moment."}\n\nTo get more details or book, please visit our website or contact us directly.`,
      });
    }

    const context: AgencyContext = {
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
      activeBookings: 0,
      totalClients: 0,
      revenueThisMonth: 0,
      totalRevenue: 0,
      recentBookingsCount: 0,
      popularCategories: [],
      currency: agency.currency,
      agencyName: agency.name,
      carsPageUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200"}/rent?agency=${agencySlug}`,
    };

    const llmMessages = (messages || []).map((m: { role: string; content: string }) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant" | "system",
      content: m.content,
    }));

    const config = {
      id: llmConfig.id,
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey ? decrypt(llmConfig.apiKey) : null,
      model: llmConfig.model,
      apiUrl: llmConfig.apiUrl,
    };

    const result = await queryLlm(llmMessages, context, config, message, "public", null, car);

    return Response.json(result);
  } catch (error) {
    console.error("Public chat API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
