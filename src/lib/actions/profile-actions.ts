"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: "User not found" };

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) return { error: "Current password is incorrect" };

    const hashed = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return { success: true };
  } catch {
    return { error: "Failed to update password" };
  }
}
