"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  agencySchema,
  llmConfigSchema,
  wassenderConfigSchema,
} from "@/lib/validations";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

async function getAgencyId(): Promise<{ agencyId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });

  if (!user?.agencyId) return { error: "No agency found" };
  return { agencyId: user.agencyId };
}

export async function getAgencySettings() {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) return { success: false, error: "Agency not found" };

    return { success: true, data: serialize(agency) };
  } catch {
    return { success: false, error: "Failed to fetch agency settings" };
  }
}

export async function updateAgency(data: unknown) {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const validated = agencySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Invalid data",
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: validated.data,
    });

    revalidatePath("/settings");
    return { success: true, data: serialize(agency) };
  } catch {
    return { success: false, error: "Failed to update agency" };
  }
}

export async function getLlmConfigs() {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const configs = await prisma.llmConfig.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: serialize(configs) };
  } catch {
    return { success: false, error: "Failed to fetch LLM configs" };
  }
}

export async function saveLlmConfig(data: unknown) {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const validated = llmConfigSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Invalid data",
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const existing = await prisma.llmConfig.findFirst({
      where: { agencyId, active: true },
    });

    if (existing) {
      const config = await prisma.llmConfig.update({
        where: { id: existing.id },
        data: {
          provider: validated.data.provider,
          apiKey: validated.data.apiKey || existing.apiKey,
          model: validated.data.model,
          apiUrl: validated.data.apiUrl || null,
          active: true,
        },
      });
      revalidatePath("/settings");
      return { success: true, data: serialize(config) };
    }

    const config = await prisma.llmConfig.create({
      data: {
        agencyId,
        provider: validated.data.provider,
        apiKey: validated.data.apiKey || null,
        model: validated.data.model,
        apiUrl: validated.data.apiUrl || null,
        active: true,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serialize(config) };
  } catch {
    return { success: false, error: "Failed to save LLM config" };
  }
}

export async function getWassenderConfig() {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const config = await prisma.wassenderConfig.findFirst({
      where: { agencyId },
    });

    return {
      success: true,
      data: config ? serialize(config) : null,
    };
  } catch {
    return { success: false, error: "Failed to fetch Wassender config" };
  }
}

export async function saveWassenderConfig(data: unknown) {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const validated = wassenderConfigSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Invalid data",
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const existing = await prisma.wassenderConfig.findFirst({
      where: { agencyId },
    });

    if (existing) {
      const config = await prisma.wassenderConfig.update({
        where: { id: existing.id },
        data: {
          apiKey: validated.data.apiKey || existing.apiKey,
          sessionId: validated.data.sessionId || existing.sessionId,
          webhookSecret:
            validated.data.webhookSecret || existing.webhookSecret,
          active: validated.data.active,
        },
      });
      revalidatePath("/settings");
      return { success: true, data: serialize(config) };
    }

    const config = await prisma.wassenderConfig.create({
      data: {
        agencyId,
        apiKey: validated.data.apiKey || null,
        sessionId: validated.data.sessionId || null,
        webhookSecret: validated.data.webhookSecret || null,
        active: validated.data.active,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serialize(config) };
  } catch {
    return { success: false, error: "Failed to save Wassender config" };
  }
}

export async function getContractTemplates() {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const templates = await prisma.contractTemplate.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: serialize(templates) };
  } catch {
    return { success: false, error: "Failed to fetch contract templates" };
  }
}

export async function saveContractTemplate(data: {
  id?: string;
  name: string;
  content: string;
  isDefault?: boolean;
}) {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    if (!data.name || !data.content) {
      return { success: false, error: "Name and content are required" };
    }

    if (data.isDefault) {
      await prisma.contractTemplate.updateMany({
        where: { agencyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    if (data.id) {
      const template = await prisma.contractTemplate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          content: data.content,
          isDefault: data.isDefault || false,
        },
      });
      revalidatePath("/settings");
      return { success: true, data: serialize(template) };
    }

    const template = await prisma.contractTemplate.create({
      data: {
        agencyId,
        name: data.name,
        content: data.content,
        isDefault: data.isDefault || false,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serialize(template) };
  } catch {
    return { success: false, error: "Failed to save contract template" };
  }
}

export async function deleteContractTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await prisma.contractTemplate.delete({ where: { id } });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete contract template" };
  }
}

export async function getAgencyUsers() {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    const users = await prisma.user.findMany({
      where: { agencyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: serialize(users) };
  } catch {
    return { success: false, error: "Failed to fetch agency users" };
  }
}

export async function createAgencyUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  try {
    const { agencyId, error } = await getAgencyId();
    if (error || !agencyId) return { success: false, error };

    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "Name, email, and password are required" };
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "staff",
        agencyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serialize(user) };
  } catch {
    return { success: false, error: "Failed to create user" };
  }
}
