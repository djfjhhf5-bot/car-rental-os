"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { updateContract } from "@/lib/actions/contract-actions";

const contractFormSchema = z.object({
  pickupOdometer: z.coerce.number().int().min(0).optional().or(z.literal("")),
  returnOdometer: z.coerce.number().int().min(0).optional().or(z.literal("")),
  fuelLevel: z.string().optional(),
  damageNotes: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface ContractFormProps {
  contractId: string;
  initialData?: {
    pickupOdometer?: number | null;
    returnOdometer?: number | null;
    fuelLevel?: string | null;
    damageNotes?: string | null;
    notes?: string | null;
  };
  onSuccess?: () => void;
}

export function ContractForm({ contractId, initialData, onSuccess }: ContractFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema) as any,
    defaultValues: {
      pickupOdometer: initialData?.pickupOdometer ?? undefined,
      returnOdometer: initialData?.returnOdometer ?? undefined,
      fuelLevel: initialData?.fuelLevel || "",
      damageNotes: initialData?.damageNotes || "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: ContractFormData) => {
    setSubmitting(true);
    setError(null);

    const result = await updateContract(contractId, data);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pickup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupOdometer">Pickup Odometer</Label>
              <Input
                id="pickupOdometer"
                type="number"
                placeholder="e.g. 45000"
                {...register("pickupOdometer")}
              />
              {errors.pickupOdometer && (
                <p className="text-xs text-destructive">{errors.pickupOdometer.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelLevel">Fuel Level</Label>
              <select
                id="fuelLevel"
                {...register("fuelLevel")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select fuel level</option>
                <option value="full">Full</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
                <option value="empty">Empty</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Return Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="returnOdometer">Return Odometer</Label>
              <Input
                id="returnOdometer"
                type="number"
                placeholder="e.g. 45200"
                {...register("returnOdometer")}
              />
              {errors.returnOdometer && (
                <p className="text-xs text-destructive">{errors.returnOdometer.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Damage Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="damageNotes">Damage Description</Label>
            <Textarea
              id="damageNotes"
              rows={3}
              placeholder="Describe any existing damage..."
              {...register("damageNotes")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional notes..."
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
