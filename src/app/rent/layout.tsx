import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Car } from "lucide-react";
import { FloatingChat } from "@/components/ai-chat/floating-chat";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { StoreNavLinks } from "@/components/public/store-nav-links";
import { StoreFooter } from "@/components/public/store-footer";

export const metadata: Metadata = {
  title: "Premium Drive | The Pinnacle of Mobility",
  description: "Experience the ultimate in luxury and performance with our exclusive fleet.",
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base max-w-container-max-width mx-auto left-0 right-0 bg-background/80 backdrop-blur-md shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <Link href="/rent" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:block text-xl font-bold tracking-tight text-white">
              Premium<span className="text-[#e94560]">Drive</span>
            </span>
            <span className="sm:hidden text-xl font-bold tracking-tight text-white">
              PD
            </span>
          </Link>
        </div>
        <StoreNavLinks />
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center w-full pt-24 pb-24">
        {children}
      </main>
      <StoreFooter />
      <Suspense fallback={null}><FloatingChat /></Suspense>
    </div>
  );
}
