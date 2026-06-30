"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useUserSession } from "@/components/providers";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { useState, useCallback, useEffect } from "react";

const FloatingChat = dynamic(
  () => import("@/components/ai-chat/floating-chat").then((m) => ({ default: m.FloatingChat })),
  { ssr: false }
);

const PUBLIC_PATHS = ["/login", "/register", "/rent", "/onboarding"];

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUserSession();
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!loading && user && !user.onboardingCompleted && !isPublicPage) {
      router.push("/onboarding");
    }
  }, [user, loading, isPublicPage, router]);

  if (!user || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        agencyName={user.name ? `${user.name}'s Agency` : "CarRental OS"}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <FloatingChat />
    </div>
  );
}
