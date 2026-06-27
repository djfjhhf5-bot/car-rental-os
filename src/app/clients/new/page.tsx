import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";

export default async function NewClientPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ClientForm />;
}
