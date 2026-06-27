"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClient } from "@/lib/actions/client-actions";
import { ClientForm } from "@/components/clients/client-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getClient(id);
        if (result.data) {
          const c = result.data;
          setClient({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email ?? "",
            phone: c.phone ?? "",
            whatsapp: c.whatsapp ?? "",
            address: c.address ?? "",
            city: c.city ?? "",
            country: c.country ?? "",
            licenseNumber: c.licenseNumber ?? "",
            licenseExpiry: c.licenseExpiry
              ? new Date(c.licenseExpiry).toISOString().split("T")[0]
              : "",
            idNumber: c.idNumber ?? "",
            notes: c.notes ?? "",
          });
        } else {
          setError(result.error ?? "Client not found");
        }
      } catch {
        setError("Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error ?? "Client not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return <ClientForm initialData={client} />;
}
