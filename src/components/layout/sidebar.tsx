"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  FileText,
  CreditCard,
  Wrench,
  Bot,
  Settings,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", key: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/fleet", key: "sidebar.fleet", icon: Car },
  { href: "/leads", key: "sidebar.leads", icon: UserPlus },
  { href: "/clients", key: "sidebar.clients", icon: Users },
  { href: "/bookings", key: "sidebar.bookings", icon: CalendarCheck },
  { href: "/contracts", key: "sidebar.contracts", icon: FileText },
  { href: "/payments", key: "sidebar.payments", icon: CreditCard },
  { href: "/maintenance", key: "sidebar.maintenance", icon: Wrench },
  { href: "/ai-chat", key: "sidebar.aiChat", icon: Bot },
  { href: "/settings", key: "sidebar.settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  agencyName?: string;
}

export default function Sidebar({ open, onClose, agencyName }: SidebarProps) {
  const pathname = usePathname();
  const { lang, dir } = useLanguage();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        dir={dir}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar-background transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Car className="h-5 w-5" />
            <span>{agencyName || "CarRental OS"}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.key, lang)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          {t("sidebar.version", lang)}
        </div>
      </aside>
    </>
  );
}
