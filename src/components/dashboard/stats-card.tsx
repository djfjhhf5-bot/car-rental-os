"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: string; positive?: boolean } | null;
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  className,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.positive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-lg p-2.5 bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
