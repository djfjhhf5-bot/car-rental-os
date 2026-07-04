import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { agency: agencySlug, name, phone, email, vehicleId, pickupDate, returnDate, notes, message } = await request.json();

    if (!agencySlug) {
      return Response.json(
        { success: false, error: "Missing 'agency' parameter" },
        { status: 400 }
      );
    }

    if (!name || !phone) {
      return Response.json(
        { success: false, error: "Name and phone are required" },
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

    let vehicleRef = "";
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, agencyId: agency.id },
      });
      if (vehicle) {
        vehicleRef = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        whatsapp: phone,
        source: "web",
        phase: "inquiry",
        status: "new",
        vehicleRequested: vehicleRef || message || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        notes: notes || message || null,
        agencyId: agency.id,
      },
    });

    return Response.json({
      success: true,
      data: { id: lead.id },
    });
  } catch (error) {
    console.error("Public orders API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
