"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
};

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agencyId: true },
    });

    if (!user?.agencyId) return { success: false, error: "No agency found" };

    const agencyId = user.agencyId;

    const [vehicles, clients, bookings, payments, maintenanceLogs] =
      await Promise.all([
        prisma.vehicle.findMany({ where: { agencyId } }),
        prisma.client.findMany({ where: { agencyId } }),
        prisma.booking.findMany({
          where: { agencyId },
          include: { client: true, vehicle: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
          where: { agencyId },
          orderBy: { paidAt: "desc" },
        }),
        prisma.maintenance.findMany({
          where: { agencyId },
          include: { vehicle: true },
          orderBy: { scheduledDate: "desc" },
        }),
      ]);

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(
      (v) => v.status === "available"
    ).length;
    const bookedVehicles = vehicles.filter(
      (v) => v.status === "booked" || v.status === "rented"
    ).length;
    const maintenanceVehicles = vehicles.filter(
      (v) => v.status === "maintenance"
    ).length;
    const totalClients = clients.length;
    const activeBookings = bookings.filter(
      (b) => b.status === "active" || b.status === "confirmed"
    ).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthPayments = payments.filter(
      (p) => p.paidAt && new Date(p.paidAt) >= startOfMonth
    );
    const totalRevenueThisMonth = thisMonthPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const revenueTrend: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthPayments = payments.filter(
        (p) =>
          p.paidAt &&
          new Date(p.paidAt) >= monthStart &&
          new Date(p.paidAt) <= monthEnd
      );
      revenueTrend.push({
        month: monthStr,
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
      .filter(
        (b) =>
          (b.status === "active" || b.status === "confirmed") &&
          new Date(b.returnDate) >= now
      )
      .sort(
        (a, b) =>
          new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime()
      )
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        client: `${b.client.firstName} ${b.client.lastName}`,
        vehicle: `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.licensePlate})`,
        returnDate: b.returnDate,
      }));

    const overdueMaintenance = maintenanceLogs
      .filter(
        (m) =>
          (m.status === "pending" || m.status === "scheduled") &&
          m.scheduledDate &&
          new Date(m.scheduledDate) < now
      )
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        vehicle: `${m.vehicle.brand} ${m.vehicle.model} (${m.vehicle.licensePlate})`,
        type: m.type,
        scheduledDate: m.scheduledDate,
      }));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

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
        totalVehicles,
        availableVehicles,
        bookedVehicles,
        maintenanceVehicles,
        totalClients,
        activeBookings,
        totalRevenueThisMonth,
        revenueTrend,
        bookingPipeline,
        fleetUtilization,
        upcomingReturns,
        overdueMaintenance,
        recentBookings,
        totalRevenue,
      },
    };
  } catch (e) {
    console.error("Dashboard error:", e instanceof Error ? e.message : e);
    console.error("Dashboard error stack:", e instanceof Error ? e.stack : "");
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
