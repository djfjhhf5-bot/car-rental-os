import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Car, Phone } from "lucide-react";
import { CustomerChat } from "@/components/public/customer-chat";
import { CarCard } from "@/components/public/car-card";
import { FilterBar } from "@/components/public/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchCars(searchParams?: string): Promise<{ data?: unknown[]; error?: string }> {
  try {
    const params = new URLSearchParams({ agency: "demo" });
    if (searchParams) {
      const extra = new URLSearchParams(searchParams);
      extra.forEach((v, k) => { if (v) params.set(k, v); });
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3456";
    const res = await fetch(`${baseUrl}/api/public/cars?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json();
      return { error: body.error || "Failed to fetch cars" };
    }
    const json = await res.json();
    return { data: json.data || [] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch cars" };
  }
}

function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function CarsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function CarsGrid({ searchParams }: { searchParams?: string }) {
  const result = await fetchCars(searchParams);

  if (result.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600">Failed to load cars: {result.error}</p>
        <p className="mt-2 text-sm text-red-500">Please try again later or contact support.</p>
      </div>
    );
  }

  const cars = result.data as Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    transmission: string;
    fuelType: string;
    seats: number;
    doors: number;
    dailyRate: number;
    category: string;
    color?: string;
    description?: string;
  }>;

  if (!cars || cars.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <Car className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-600">No cars available</h3>
        <p className="text-sm text-gray-500">
          We currently have no vehicles matching your criteria. Please try different filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cars.map((car) => (
        <CarCard
          key={car.id}
          id={car.id}
          brand={car.brand}
          model={car.model}
          year={car.year}
          transmission={car.transmission}
          fuelType={car.fuelType}
          seats={car.seats}
          dailyRate={car.dailyRate}
          category={car.category}
        />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const searchQuery = params ? new URLSearchParams(params).toString() : "";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">
              Premium<span className="text-[#e94560]">Drive</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#1a1a2e]">
              Home
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#1a1a2e]">
              Cars
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#1a1a2e]">
              Contact
            </Link>
          </nav>

          <a href="tel:+1-555-0100" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e] transition-colors hover:text-[#e94560]">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">+1-555-0100</span>
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find Your Perfect Rental Car
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-300 sm:text-xl">
                Premium vehicles at competitive rates. Choose from our curated fleet of quality cars for any occasion.
              </p>
            </div>
          </div>
        </section>

        <section className="relative -mt-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-gray-100" />}>
              <FilterBar />
            </Suspense>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#1a1a2e] sm:text-4xl">Our Premium Fleet</h2>
            <p className="mt-3 text-gray-500">Hand-picked vehicles for every journey</p>
          </div>
          <Suspense fallback={<CarsGridSkeleton />}>
            <CarsGrid searchParams={searchQuery || undefined} />
          </Suspense>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a2e]">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-[#1a1a2e]">
                  Premium<span className="text-[#e94560]">Drive</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Premium car rental services with a fleet of quality vehicles for every occasion.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/" className="transition-colors hover:text-[#e94560]">Home</Link></li>
                <li><Link href="/" className="transition-colors hover:text-[#e94560]">Cars</Link></li>
                <li><Link href="/" className="transition-colors hover:text-[#e94560]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>123 Main Street</li>
                <li>New York, NY 10001</li>
                <li><a href="tel:+1-555-0100" className="transition-colors hover:text-[#e94560]">+1-555-0100</a></li>
                <li><a href="mailto:info@premiumdrive.com" className="transition-colors hover:text-[#e94560]">info@premiumdrive.com</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Hours</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Mon - Fri: 8:00 AM - 8:00 PM</li>
                <li>Saturday: 9:00 AM - 6:00 PM</li>
                <li>Sunday: 10:00 AM - 4:00 PM</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Premium Drive. All rights reserved.
          </div>
        </div>
      </footer>

      <CustomerChat />
    </div>
  );
}
