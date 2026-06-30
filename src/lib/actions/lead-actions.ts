"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFile, type ParsedLead } from "@/lib/services/file-parser";
import { sendDm, getPhaseMessage } from "@/lib/services/wassender";
import { revalidatePath } from "next/cache";

export async function getLeads(): Promise<{ success: boolean; error?: string; data?: unknown[] }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const leads = await prisma.lead.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { success: true, data: leads };
}

export async function getLead(id: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { success: false, error: "Lead not found" };

  return { success: true, data: lead };
}

export async function deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadPhase(id: string, phase: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  await prisma.lead.update({ where: { id }, data: { phase } });
  revalidatePath("/leads");
  return { success: true };
}

export async function importLeadsFromFile(formData: FormData): Promise<{ success: boolean; error?: string; data?: { importId: string; total: number; imported: number; skipped: number; errors?: string[] } }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file provided" };

  const content = await file.text();
  const result = await parseFile(content, file.name);

  if (result.leads.length === 0) {
    return { success: false, error: result.errors.join(", ") || "No leads found in file" };
  }

  const importRecord = await prisma.leadImport.create({
    data: {
      fileName: file.name,
      fileType: result.fileType,
      rowsTotal: result.leads.length,
      rowsImported: 0,
      rowsSkipped: 0,
      status: "completed",
      agencyId: user.agencyId,
    },
  });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of result.leads) {
    try {
      const phone = lead.phone || lead.whatsapp;
      const existing = phone
        ? await prisma.lead.findFirst({
            where: { agencyId: user.agencyId, phone },
          })
        : null;

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            name: lead.customerName,
            whatsapp: lead.whatsapp,
            customerName: lead.customerName,
            vehicleRequested: lead.vehicleRequested,
            pickupDate: lead.pickupDate ? new Date(lead.pickupDate) : undefined,
            returnDate: lead.returnDate ? new Date(lead.returnDate) : undefined,
            pickupLocation: lead.pickupLocation,
            returnLocation: lead.returnLocation,
            totalAmount: lead.totalAmount,
            depositAmount: lead.depositAmount,
            contractNumber: lead.contractNumber,
            insuranceType: lead.insuranceType,
            driverLicenseNumber: lead.driverLicenseNumber,
            nationality: lead.nationality,
            notes: lead.notes,
            importId: importRecord.id,
          },
        });
        skipped++;
      } else {
        const pickupDate = lead.pickupDate ? new Date(lead.pickupDate) : undefined;
        const returnDate = lead.returnDate ? new Date(lead.returnDate) : undefined;

        await prisma.lead.create({
          data: {
            name: lead.customerName,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            email: lead.email,
            customerName: lead.customerName,
            vehicleRequested: lead.vehicleRequested,
            pickupDate: pickupDate && !isNaN(pickupDate.getTime()) ? pickupDate : undefined,
            returnDate: returnDate && !isNaN(returnDate.getTime()) ? returnDate : undefined,
            pickupLocation: lead.pickupLocation,
            returnLocation: lead.returnLocation,
            totalAmount: lead.totalAmount,
            depositAmount: lead.depositAmount,
            contractNumber: lead.contractNumber,
            insuranceType: lead.insuranceType,
            driverLicenseNumber: lead.driverLicenseNumber,
            nationality: lead.nationality,
            notes: lead.notes,
            source: "import",
            phase: detectPhase(lead),
            status: "new",
            importId: importRecord.id,
            agencyId: user.agencyId,
          },
        });
        imported++;
      }
    } catch (e) {
      errors.push(`Error importing ${lead.customerName}: ${e instanceof Error ? e.message : "Unknown"}`);
      skipped++;
    }
  }

  await prisma.leadImport.update({
    where: { id: importRecord.id },
    data: { rowsImported: imported, rowsSkipped: skipped },
  });

  revalidatePath("/leads");

  return {
    success: true,
    data: {
      importId: importRecord.id,
      total: result.leads.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    },
  };
}

function detectPhase(lead: ParsedLead): string {
  if (lead.depositAmount && lead.depositAmount > 0) return "booked";
  if (lead.totalAmount && lead.totalAmount > 0) return "quoted";
  if (lead.vehicleRequested && (lead.pickupDate || lead.returnDate)) return "follow-up";
  if (lead.vehicleRequested) return "quoted";
  return "inquiry";
}

export async function sendLeadDm(leadId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.agencyId !== user.agencyId) return { success: false, error: "Lead not found" };

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
  const number = lead.whatsapp || lead.phone;
  if (!number) return { success: false, error: "Lead has no phone number" };

  const message = getPhaseMessage(lead.phase, lead.name || lead.customerName || "there", agency?.name || "Our Agency");
  console.log("Sending DM to", number, "for lead", lead.id);
  const result = await sendDm({ to: number, message, agencyId: user.agencyId });
  console.log("DM result:", result);

  if (result.success) {
    await prisma.activity.create({
      data: {
        action: "dm_sent",
        entity: "lead",
        entityId: lead.id,
        details: `Sent ${lead.phase} phase message to ${lead.name}`,
        agencyId: user.agencyId,
        userId: session.user.id,
      },
    });
  }

  return result;
}

export async function sendBatchDm(phaseFilter?: string): Promise<{ success: boolean; error?: string; data?: { sent: number; failed: number; errors?: string[] } }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });

  const where: Record<string, unknown> = { agencyId: user.agencyId, NOT: { phone: null } };
  if (phaseFilter) where.phase = phaseFilter;

  const leads = await prisma.lead.findMany({ where });
  if (leads.length === 0) return { success: false, error: "No leads to message" };

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const number = lead.whatsapp || lead.phone;
    if (!number) { failed++; continue; }

    const message = getPhaseMessage(lead.phase, lead.name || lead.customerName || "there", agency?.name || "Our Agency");
    const result = await sendDm({ to: number, message, agencyId: user.agencyId });

    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(`${lead.name}: ${result.error}`);
    }
  }

  return { success: true, data: { sent, failed, errors: errors.length > 0 ? errors : undefined } };
}

export async function convertLeadToClient(leadId: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.agencyId !== user.agencyId) return { success: false, error: "Lead not found" };

  const nameParts = (lead.name || lead.customerName || "Unknown").split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const client = await prisma.client.create({
    data: {
      firstName,
      lastName,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      notes: lead.notes ? `${lead.notes}\n(Converted from lead ${lead.id})` : `Converted from lead ${lead.id}`,
      agencyId: user.agencyId,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { phase: "client", status: "converted" },
  });

  await prisma.activity.create({
    data: {
      action: "lead_converted",
      entity: "lead",
      entityId: lead.id,
      details: `Lead ${lead.name} converted to client ${client.firstName} ${client.lastName}`,
      agencyId: user.agencyId,
      userId: session.user.id,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/clients");

  return { success: true, data: client };
}

export async function getLeadStats(): Promise<{ success: boolean; error?: string; data?: { total: number; byPhase: { phase: string; _count: number }[]; recent: unknown[] } }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const [total, byPhase, recent] = await Promise.all([
    prisma.lead.count({ where: { agencyId: user.agencyId } }),
    prisma.lead.groupBy({
      by: ["phase"],
      where: { agencyId: user.agencyId },
      _count: true,
    }),
    prisma.lead.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    success: true,
    data: { total, byPhase, recent },
  };
}

export async function getImportHistory(): Promise<{ success: boolean; error?: string; data?: unknown[] }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const imports = await prisma.leadImport.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { success: true, data: imports };
}

export async function getWasenderConfig(): Promise<{ success: boolean; error?: string; data?: { configured: boolean; active: boolean } }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { success: false, error: "User not found" };

  const config = await prisma.wassenderConfig.findFirst({
    where: { agencyId: user.agencyId },
  });

  return {
    success: true,
    data: config ? { configured: true, active: config.active } : { configured: false, active: false },
  };
}
