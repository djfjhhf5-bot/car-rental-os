import { auth } from "@/lib/auth";

export async function getCurrentAgencyId(): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const agencyId = (session.user as { agencyId?: string }).agencyId;
  if (!agencyId) {
    throw new Error("No agency found for current user");
  }
  return agencyId;
}
