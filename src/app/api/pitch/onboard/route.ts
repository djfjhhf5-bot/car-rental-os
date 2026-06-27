import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, questionnaire, lang } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const hashedPassword = await bcrypt.hash(password, 12);

    const agency = await prisma.agency.create({
      data: {
        name: `${name}'s Agency`,
        slug,
        email,
      },
    });

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
        agencyId: agency.id,
      },
    });

    if (questionnaire) {
      try {
        await prisma.lead.create({
          data: {
            name,
            email,
            phone: questionnaire.phone || null,
            company: questionnaire.company || null,
            source: "onboarding_questionnaire",
            lang: lang || "en",
            status: "onboarded",
          },
        });
      } catch {
        console.log("QUESTIONNAIRE_DATA:", JSON.stringify(questionnaire));
      }
    }

    let signedIn = false;
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      signedIn = true;
    } catch (signInError) {
      console.warn("Auto sign-in failed, user can log in manually:", signInError);
    }

    return NextResponse.json({
      success: true,
      signedIn,
      redirectUrl: signedIn ? "/dashboard" : "/login",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
