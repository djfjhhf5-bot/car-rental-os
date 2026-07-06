import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return Response.json(
        { success: false, error: "Missing 'slug' query parameter" },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        phone: true,
        email: true,
        address: true,
        currency: true,
      },
    });

    if (!agency) {
      return Response.json(
        { success: false, error: "Agency not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: agency });
  } catch (error) {
    console.error("Public agency API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
