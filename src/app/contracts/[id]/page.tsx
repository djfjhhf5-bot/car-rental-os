"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, PenLine, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractForm } from "@/components/contracts/contract-form";
import { getContract, signContract } from "@/lib/actions/contract-actions";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ContractData {
  id: string;
  contractNumber: string;
  status: string;
  signedByClient: boolean;
  signedByAgency: boolean;
  signedAt: Date | string | null;
  pickupOdometer: number | null;
  returnOdometer: number | null;
  fuelLevel: string | null;
  damageNotes: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    licenseNumber: string | null;
    address: string | null;
    city: string | null;
  };
  booking: {
    id: string;
    pickupDate: Date | string;
    returnDate: Date | string;
    pickupLocation: string | null;
    returnLocation: string | null;
    totalAmount: number;
    depositAmount: number;
    depositPaid: boolean;
    fullyPaid: boolean;
    payments: Array<{ id: string; amount: number; status: string; method: string }>;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      licensePlate: string;
      color: string | null;
      dailyRate: number;
    };
  };
  user: { name: string; email: string };
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingRole, setSigningRole] = useState<string | null>(null);

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getContract(params.id as string);
      if (result.data) {
        setContract(result.data);
      } else {
        setError(result.error ?? "Contract not found");
      }
    } catch {
      setError("Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleSign = async (role: "client" | "agency") => {
    setSigningRole(role);
    const result = await signContract(params.id as string, role);
    setSigningRole(null);
    if (!result.error) {
      loadContract();
      router.refresh();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <FileText className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{error || "Contract not found"}</p>
        <Button asChild>
          <Link href="/contracts">Back to Contracts</Link>
        </Button>
      </div>
    );
  }

  const allSigned = contract.signedByClient && contract.signedByAgency;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {contract.contractNumber}
              </h1>
              <Badge className={getStatusColor(contract.status)}>
                {contract.status}
              </Badge>
              {allSigned && (
                <Badge className="bg-green-100 text-green-800">All Signed</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(contract.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {!allSigned && (
            <>
              <Button
                variant={contract.signedByClient ? "outline" : "default"}
                onClick={() => handleSign("client")}
                disabled={!!signingRole || contract.signedByClient}
              >
                {signingRole === "client" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PenLine className="h-4 w-4 mr-2" />
                )}
                {contract.signedByClient ? "Signed by Client" : "Sign as Client"}
              </Button>
              <Button
                variant={contract.signedByAgency ? "outline" : "default"}
                onClick={() => handleSign("agency")}
                disabled={!!signingRole || contract.signedByAgency}
              >
                {signingRole === "agency" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PenLine className="h-4 w-4 mr-2" />
                )}
                {contract.signedByAgency ? "Signed by Agency" : "Sign as Agency"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Contract Number</p>
                <p className="text-sm font-mono font-medium">{contract.contractNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(contract.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(contract.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Signature Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Client Signature</span>
              {contract.signedByClient ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" /> Signed
                </Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Agency Signature</span>
              {contract.signedByAgency ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" /> Signed
                </Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
            {contract.signedAt && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Signed At</p>
                <p className="text-sm">{formatDate(contract.signedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {contract.client.firstName} {contract.client.lastName}</p>
            {contract.client.email && <p><span className="text-muted-foreground">Email:</span> {contract.client.email}</p>}
            {contract.client.phone && <p><span className="text-muted-foreground">Phone:</span> {contract.client.phone}</p>}
            {contract.client.licenseNumber && <p><span className="text-muted-foreground">License:</span> {contract.client.licenseNumber}</p>}
            {(contract.client.address || contract.client.city) && (
              <p><span className="text-muted-foreground">Address:</span> {[contract.client.address, contract.client.city].filter(Boolean).join(", ")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Vehicle:</span> {contract.booking.vehicle.brand} {contract.booking.vehicle.model} ({contract.booking.vehicle.year})</p>
            <p><span className="text-muted-foreground">License Plate:</span> {contract.booking.vehicle.licensePlate}</p>
            {contract.booking.vehicle.color && <p><span className="text-muted-foreground">Color:</span> {contract.booking.vehicle.color}</p>}
            <p><span className="text-muted-foreground">Daily Rate:</span> {formatCurrency(contract.booking.vehicle.dailyRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pickup</p>
              <p className="font-medium">{formatDate(contract.booking.pickupDate)}</p>
              {contract.booking.pickupLocation && (
                <p className="text-xs text-muted-foreground">{contract.booking.pickupLocation}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Return</p>
              <p className="font-medium">{formatDate(contract.booking.returnDate)}</p>
              {contract.booking.returnLocation && (
                <p className="text-xs text-muted-foreground">{contract.booking.returnLocation}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-medium">{formatCurrency(contract.booking.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">
                Deposit: {formatCurrency(contract.booking.depositAmount)}
                {contract.booking.depositPaid && " (Paid)"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="print:hidden">
        <ContractForm
          contractId={contract.id}
          initialData={{
            pickupOdometer: contract.pickupOdometer,
            returnOdometer: contract.returnOdometer,
            fuelLevel: contract.fuelLevel,
            damageNotes: contract.damageNotes,
            notes: contract.notes,
          }}
          onSuccess={loadContract}
        />
      </div>
    </div>
  );
}
