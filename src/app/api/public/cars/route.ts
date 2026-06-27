import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencySlug = searchParams.get("agency");
    const carId = searchParams.get("id");

    if (!agencySlug) {
      return Response.json(
        { success: false, error: "Missing 'agency' query parameter" },
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

    if (carId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: carId,
          agencyId: agency.id,
          published: true,
        },
      });

      if (!vehicle) {
        return Response.json(
          { success: false, error: "Car not found" },
          { status: 404 }
        );
      }

      return Response.json({ success: true, data: vehicle });
    }

    const params = new URL(request.url).searchParams;
    const category = params.get("category");
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    const search = params.get("search");

    const where: Record<string, unknown> = {
      agencyId: agency.id,
      published: true,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      const rateFilter: Record<string, number> = {};
      if (minPrice) rateFilter.gte = parseFloat(minPrice);
      if (maxPrice) rateFilter.lte = parseFloat(maxPrice);
      where.dailyRate = rateFilter;
    }

    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Public cars API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
