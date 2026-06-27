"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { createClient, updateClient } from "@/lib/actions/client-actions";
import { clientSchema } from "@/lib/validations";
import Link from "next/link";

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: ClientFormData & { id: string };
}

export function ClientForm({ initialData }: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      country: "",
      licenseNumber: "",
      licenseExpiry: "",
      idNumber: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setSubmitting(true);
    setError(null);

    const result = initialData
      ? await updateClient(initialData.id, data)
      : await createClient(data);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  };

  const fields: Array<{
    name: keyof ClientFormData;
    label: string;
    type?: string;
    placeholder?: string;
    colSpan?: string;
  }> = [
    { name: "firstName", label: "First Name", placeholder: "John" },
    { name: "lastName", label: "Last Name", placeholder: "Doe" },
    { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
    { name: "phone", label: "Phone", placeholder: "+1 (555) 123-4567" },
    { name: "whatsapp", label: "WhatsApp", placeholder: "+1 (555) 123-4567" },
    { name: "address", label: "Address", placeholder: "123 Main St", colSpan: "md:col-span-2" },
    { name: "city", label: "City", placeholder: "New York" },
    { name: "country", label: "Country", placeholder: "USA" },
    { name: "licenseNumber", label: "License Number", placeholder: "DL-123456" },
    { name: "licenseExpiry", label: "License Expiry", type: "date" },
    { name: "idNumber", label: "ID Number", placeholder: "ID-123456" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {initialData ? "Edit Client" : "New Client"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialData ? "Update client information" : "Add a new client to the system"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialData ? "Update Client" : "Save Client"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={field.colSpan || ""}>
                <Label htmlFor={field.name} className="mb-2 block">
                  {field.label}
                </Label>
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  {...register(field.name)}
                />
                {errors[field.name] && (
                  <p className="text-sm text-destructive mt-1">
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="notes" className="mb-2 block">
            Notes
          </Label>
          <textarea
            id="notes"
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            placeholder="Additional notes about this client..."
            {...register("notes")}
          />
        </CardContent>
      </Card>
    </form>
  );
}
