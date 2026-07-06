"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type DashboardStats = {
  totalVehicles: number;
  availableVehicles: number;
  bookedVehicles: number;
  maintenanceVehicles: number;
  totalClients: number;
  activeBookings: number;
  totalRevenueThisMonth: number;
  revenueTrend: { month: string; revenue: number }[];
  bookingPipeline: { status: string; count: number }[];
  fleetUtilization: { name: string; value: number; fill: string }[];
  upcomingReturns: {
    id: string;
    client: string;
    vehicle: string;
    returnDate: Date;
  }[];
  overdueMaintenance: {
    id: string;
    vehicle: string;
    type: string;
    scheduledDate: Date | null;
  }[];
  recentBookings: {
    id: string;
    client: string;
    vehicle: string;
    vehicleId: string;
    totalAmount: number;
    status: string;
    pickupDate: Date;
    returnDate: Date;
  }[];
  totalRevenue: number;
  leadStats: {
    total: number;
    byPhase: { phase: string; count: number }[];
  };
  recentLeads: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    vehicleRequested: string | null;
    pickupDate: Date | null;
    returnDate: Date | null;
    phase: string;
    status: string;
    source: string;
    createdAt: Date;
  }[];
};

export async function getDashboardStats(agencyId: string): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  try {
    if (!agencyId) return { success: false, error: "No agency found" };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [vehicles, totalClients, rawBookings, payments, rawMaintenance, leadStats, rawRecentLeads] =
      await Promise.all([
        prisma.vehicle.findMany({ where: { agencyId } }),
        prisma.client.count({ where: { agencyId } }),
        prisma.booking.findMany({
          where: { agencyId },
          include: { client: true, vehicle: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.payment.findMany({
          where: { agencyId, paidAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
          orderBy: { paidAt: "desc" },
        }),
        prisma.maintenance.findMany({
          where: { agencyId },
          include: { vehicle: true },
          orderBy: { scheduledDate: "desc" },
          take: 50,
        }),
        prisma.lead.groupBy({
          by: ["phase"],
          where: { agencyId },
          _count: true,
        }),
        prisma.lead.findMany({
          where: { agencyId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);
    type BookingWithRelations = Prisma.BookingGetPayload<{ include: { client: true; vehicle: true } }>;
    const bookings = rawBookings as BookingWithRelations[];
    const leadData = leadStats as { _count: number; phase: string }[];
    type MaintWithRelations = Prisma.MaintenanceGetPayload<{ include: { vehicle: true } }>;
    const maintenanceLogs = rawMaintenance as MaintWithRelations[];

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v) => v.status === "available").length;
    const bookedVehicles = vehicles.filter((v) => v.status === "booked" || v.status === "rented").length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
    const activeBookings = rawBookings.filter((b) => b.status === "active" || b.status === "confirmed").length;

    const thisMonthPayments = payments.filter((p) => p.paidAt && p.paidAt >= startOfMonth);
    const totalRevenueThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueTrend: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthPayments = payments.filter(
        (p) => p.paidAt && p.paidAt >= monthStart && p.paidAt <= monthEnd
      );
      revenueTrend.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      });
    }

    const pipelineStatuses = ["inquiry", "confirmed", "active", "completed"];
    const bookingPipeline = pipelineStatuses.map((status) => ({
      status,
      count: bookings.filter((b) => b.status === status).length,
    }));

    const fleetUtilization = [
      { name: "Available", value: availableVehicles, fill: "#22c55e" },
      { name: "Booked/Rented", value: bookedVehicles, fill: "#3b82f6" },
      { name: "Maintenance", value: maintenanceVehicles, fill: "#eab308" },
    ];

    const upcomingReturns = bookings
      .filter((b) => (b.status === "active" || b.status === "confirmed") && b.returnDate >= now)
      .sort((a, b) => a.returnDate.getTime() - b.returnDate.getTime())
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        client: `${b.client.firstName} ${b.client.lastName}`,
        vehicle: `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.licensePlate})`,
        returnDate: b.returnDate,
      }));

    const overdueMaintenance = maintenanceLogs
      .filter((m) => (m.status === "pending" || m.status === "scheduled") && m.scheduledDate && m.scheduledDate < now)
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        vehicle: `${m.vehicle.brand} ${m.vehicle.model} (${m.vehicle.licensePlate})`,
        type: m.type,
        scheduledDate: m.scheduledDate,
      }));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const leadStatsData = {
      total: leadData.reduce((s, l) => s + l._count, 0),
      byPhase: leadData.map((l) => ({ phase: l.phase, count: l._count })),
    };

    const recentLeadsData = rawRecentLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      whatsapp: l.whatsapp,
      vehicleRequested: l.vehicleRequested,
      pickupDate: l.pickupDate,
      returnDate: l.returnDate,
      phase: l.phase,
      status: l.status,
      source: l.source,
      createdAt: l.createdAt,
    }));

    const recentBookings = bookings.slice(0, 5).map((b) => ({
      id: b.id,
      client: `${b.client.firstName} ${b.client.lastName}`,
      vehicle: `${b.vehicle.brand} ${b.vehicle.model}`,
      vehicleId: b.vehicleId,
      totalAmount: b.totalAmount,
      status: b.status,
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
    }));

    return {
      success: true,
      data: {
        totalVehicles, availableVehicles, bookedVehicles, maintenanceVehicles,
        totalClients, activeBookings, totalRevenueThisMonth, totalRevenue,
        revenueTrend, bookingPipeline, fleetUtilization,
        upcomingReturns,
        overdueMaintenance,
        recentBookings,
        leadStats: leadStatsData,
        recentLeads: recentLeadsData,
      },
    };
  } catch (e) {
    console.error("Dashboard error:", e instanceof Error ? e.message : e);
    console.error("Dashboard error stack:", e instanceof Error ? e.stack : "");
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
