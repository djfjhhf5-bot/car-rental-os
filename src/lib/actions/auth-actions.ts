"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations";

export async function registerUser(name: string, email: string, password: string) {
  const validated = registerSchema.safeParse({ name, email, password });
  if (!validated.success) {
    return { error: "Invalid input. Please check your fields." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: validated.data.email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const slug = validated.data.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const hashedPassword = await bcrypt.hash(validated.data.password, 12);

  const agency = await prisma.agency.create({
    data: {
      name: `${validated.data.name}'s Agency`,
      slug,
      email: validated.data.email,
    },
  });

  await prisma.user.create({
    data: {
      name: validated.data.name,
      email: validated.data.email,
      password: hashedPassword,
      role: "admin",
      agencyId: agency.id,
    },
  });

  let signedIn = false;
  for (let i = 0; i < 3; i++) {
    try {
      await signIn("credentials", {
        email: validated.data.email,
        password: validated.data.password,
        redirect: false,
      });
      signedIn = true;
      break;
    } catch {
      if (i < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!signedIn) {
    return { success: true, warning: "Account created. Please sign in." };
  }

  return { success: true };
}

export async function loginUser(email: string, password: string) {
  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: "Invalid input. Please check your fields." };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true };
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function signOutUser() {
  await signOut({ redirect: false });
}

export async function getUserWithAgency() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agency: true },
    });

    return user;
  } catch {
    return null;
  }
}
