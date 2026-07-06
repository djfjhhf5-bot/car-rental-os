import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RentPageContent } from "@/components/public/rent-page-content";

export default async function AgencyRentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="w-full max-w-[1000px] mx-auto mb-8">
        <div className="glass-panel rounded-xl p-6 ambient-shadow">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    }>
      <RentPageContent agency={slug} />
    </Suspense>
  );
}
