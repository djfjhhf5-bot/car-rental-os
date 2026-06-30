"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getOnboardingStatus() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { agency: true },
  });

  if (!user) return null;

  return {
    step: user.agency.onboardingStep,
    completed: user.agency.onboardingCompleted,
    agency: {
      name: user.agency.name,
      phone: user.agency.phone,
      address: user.agency.address,
      timezone: user.agency.timezone,
    },
  };
}

export async function saveAgencyProfile(data: {
  name: string;
  phone: string;
  address: string;
  timezone: string;
  fleetSize?: number;
  yearsInBusiness?: number;
  biggestChallenge?: string;
  currentSoftware?: string;
  referralSource?: string;
  monthlyBookings?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { error: "User not found" };

  await prisma.agency.update({
    where: { id: user.agencyId },
    data: {
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      timezone: data.timezone,
      fleetSize: data.fleetSize || null,
      yearsInBusiness: data.yearsInBusiness || null,
      biggestChallenge: data.biggestChallenge || null,
      currentSoftware: data.currentSoftware || null,
      referralSource: data.referralSource || null,
      monthlyBookings: data.monthlyBookings || null,
      onboardingStep: 1,
    },
  });

  return { success: true };
}

export async function saveFirstVehicle(data: {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  dailyRate: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { error: "User not found" };

  await prisma.vehicle.create({
    data: {
      brand: data.brand,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      dailyRate: data.dailyRate,
      status: "available",
      agencyId: user.agencyId,
    },
  });

  await prisma.agency.update({
    where: { id: user.agencyId },
    data: { onboardingStep: 2 },
  });

  return { success: true };
}

export async function skipVehicle() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { error: "User not found" };

  await prisma.agency.update({
    where: { id: user.agencyId },
    data: { onboardingStep: 2 },
  });

  return { success: true };
}

export async function saveLeadImport() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyId: true } });
  if (!user) return { error: "User not found" };
  await prisma.agency.update({ where: { id: user.agencyId }, data: { onboardingStep: 3 } });
  return { success: true };
}

export async function skipLeadImport() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyId: true } });
  if (!user) return { error: "User not found" };
  await prisma.agency.update({ where: { id: user.agencyId }, data: { onboardingStep: 3 } });
  return { success: true };
}

export async function completeOnboarding() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!user) return { error: "User not found" };

  await prisma.agency.update({
    where: { id: user.agencyId },
    data: {
      onboardingCompleted: true,
      onboardingStep: 3,
    },
  });

  return { success: true };
}
