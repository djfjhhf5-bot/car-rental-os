import type { Metadata } from "next";
import { Suspense } from "react";
import { FloatingChat } from "@/components/ai-chat/floating-chat";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { StoreNavLinks } from "@/components/public/store-nav-links";
import { StoreBrand } from "@/components/public/store-brand";
import { StoreFooter } from "@/components/public/store-footer";

export const metadata: Metadata = {
  title: "Premium Car Rental",
  description: "Browse our fleet of premium vehicles for rent.",
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base max-w-container-max-width mx-auto left-0 right-0 bg-background/80 backdrop-blur-md shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <Suspense fallback={
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.5 11.5 2.2 13 3.7 13h1.3c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h1c0 1.7 1.3 3 3 3s3-1.3 3-3h2c0 1.7 1.3 3 3 3s3-1.3 3-3zm-13 1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm10 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>
              </div>
              <span className="hidden sm:block text-xl font-bold tracking-tight text-white">Premium<span style={{ color: "#e94560" }}>Drive</span></span>
              <span className="sm:hidden text-xl font-bold tracking-tight text-white">PD</span>
            </div>
          }>
            <StoreBrand />
          </Suspense>
        </div>
        <Suspense fallback={null}><StoreNavLinks /></Suspense>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center w-full pt-24 pb-24">
        {children}
      </main>
      <Suspense fallback={null}><StoreFooter /></Suspense>
      <Suspense fallback={null}><FloatingChat /></Suspense>
    </div>
  );
}
