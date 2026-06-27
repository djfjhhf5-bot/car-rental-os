import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, type DashboardStats } from "@/lib/actions/dashboard-actions";
import { DashboardContent } from "../dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await getDashboardStats();

  return <DashboardContent data={result.success ? result.data as DashboardStats : null} error={result.success ? undefined : result.error} />;
}
