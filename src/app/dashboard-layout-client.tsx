"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { FloatingChat } from "@/components/ai-chat/floating-chat";

export default function DashboardLayoutClient({
  children,
  agencyName,
}: {
  children: React.ReactNode;
  agencyName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        agencyName={agencyName}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <FloatingChat />
    </div>
  );
}
