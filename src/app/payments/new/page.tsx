import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaymentForm } from "@/components/payments/payment-form";

export default async function NewPaymentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });

  if (!user?.agencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">No Agency Found</h2>
        <p className="text-muted-foreground">Please set up your agency first.</p>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { agencyId: user.agencyId },
    include: {
      client: { select: { firstName: true, lastName: true } },
      vehicle: { select: { brand: true, model: true, licensePlate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <PaymentForm bookings={bookings} />;
}
