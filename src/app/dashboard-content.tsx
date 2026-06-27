"use client";

import { StatsCard, StatsCardSkeleton } from "@/components/dashboard/stats-card";
import {
  FleetUtilizationChart,
  RevenueChart,
  ChartSkeleton,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { DashboardStats } from "@/lib/actions/dashboard-actions";
import {
  Car,
  CheckCircle,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Users,
  Building2,
} from "lucide-react";

interface DashboardContentProps {
  data: DashboardStats | null;
  error?: string;
}

function getBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "default" as const;
    case "active":
      return "secondary" as const;
    case "completed":
      return "secondary" as const;
    case "inquiry":
      return "outline" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function DashboardContent({ data, error }: DashboardContentProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const summaryItems = [
    {
      label: "Fleet",
      value: `${data.availableVehicles}/${data.totalVehicles} available`,
      detail: `${data.maintenanceVehicles} in maintenance`,
    },
    {
      label: "Bookings",
      value: `${data.activeBookings} active`,
      detail: `${data.bookingPipeline.reduce((a, b) => a + b.count, 0)} total pipeline`,
    },
    {
      label: "Revenue",
      value: formatCurrency(data.totalRevenueThisMonth),
      detail: `${data.revenueTrend[data.revenueTrend.length - 1]?.month || ""} month`,
    },
    {
      label: "Clients",
      value: `${data.totalClients} total`,
      detail: `${data.recentBookings.length} recent bookings`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your rental agency performance
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">
              AI Agency Summary
            </CardTitle>
          </div>
          <CardDescription>
            Key insights at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Car}
          label="Total Vehicles"
          value={data.totalVehicles}
          trend={{
            value: `${data.availableVehicles} available`,
            positive: data.availableVehicles > data.maintenanceVehicles,
          }}
        />
        <StatsCard
          icon={CheckCircle}
          label="Available"
          value={data.availableVehicles}
          trend={{
            value: `${((data.availableVehicles / Math.max(data.totalVehicles, 1)) * 100).toFixed(0)}% of fleet`,
            positive: data.availableVehicles > data.bookedVehicles,
          }}
          iconClassName="text-green-600 bg-green-100 dark:bg-green-950"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Active Bookings"
          value={data.activeBookings}
          trend={{
            value: `${data.bookingPipeline.find((b) => b.status === "inquiry")?.count || 0} pending inquiries`,
            positive: true,
          }}
          iconClassName="text-blue-600 bg-blue-100 dark:bg-blue-950"
        />
        <StatsCard
          icon={DollarSign}
          label="Revenue This Month"
          value={formatCurrency(data.totalRevenueThisMonth)}
          trend={{
            value: `${data.totalRevenue > 0 ? ((data.totalRevenueThisMonth / data.totalRevenue) * 100).toFixed(0) : 0}% of total`,
            positive: data.totalRevenueThisMonth > 0,
          }}
          iconClassName="text-yellow-600 bg-yellow-100 dark:bg-yellow-950"
        />
      </div>

      {data.upcomingReturns.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Upcoming Returns
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingReturns.map((ret) => (
                <div
                  key={ret.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{ret.client}</span>
                  <span className="text-muted-foreground">{ret.vehicle}</span>
                  <span className="text-amber-700 dark:text-amber-400">
                    {formatDate(ret.returnDate)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <FleetUtilizationChart data={data.fleetUtilization} />
        <RevenueChart data={data.revenueTrend} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No bookings yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{b.client}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.vehicle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.pickupDate)} - {formatDate(b.returnDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(b.totalAmount)}
                      </p>
                      <Badge
                        variant={getBadgeVariant(b.status)}
                        className="mt-1 text-[10px]"
                      >
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.overdueMaintenance.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  No overdue maintenance
                </p>
                <p className="text-xs text-muted-foreground">
                  All vehicles are up to date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.overdueMaintenance.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950/20"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{m.vehicle}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-[10px]">
                        Overdue
                      </Badge>
                      {m.scheduledDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(m.scheduledDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
