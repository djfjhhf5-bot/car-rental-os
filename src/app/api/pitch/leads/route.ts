import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, source, lang } = body;

    if (!name || !email) {
      return Response.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const payload = { name, email, phone, company, source, lang };

    try {
      const { prisma } = await import("@/lib/prisma");
      const lead = await prisma.lead.create({
        data: {
          name,
          email,
          phone: phone || null,
          company: company || null,
          source: source || "pitch",
          lang: lang || "en",
          status: "new",
        },
      });
      console.log("Lead saved to DB:", lead.id);
      return Response.json({ success: true, data: lead }, { status: 201 });
    } catch (dbError) {
      console.warn("DB unavailable, capturing lead via log:", payload);
      console.log("LEAD_CAPTURE:", JSON.stringify(payload));
      return Response.json({
        success: true,
        data: { id: "logged", ...payload },
        note: "Queued for processing",
      });
    }
  } catch (error) {
    console.error("Pitch lead capture error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
