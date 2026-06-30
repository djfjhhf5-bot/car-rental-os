import type { Metadata } from "next";
import Link from "next/link";
import { Car } from "lucide-react";
import { FloatingChat } from "@/components/ai-chat/floating-chat";

export const metadata: Metadata = {
  title: "Premium Drive | The Pinnacle of Mobility",
  description: "Experience the ultimate in luxury and performance with our exclusive fleet.",
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base max-w-container-max-width mx-auto left-0 right-0 bg-background/80 backdrop-blur-md shadow-2xl shadow-black/40">
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
        <div className="hidden md:flex items-center gap-8 font-manrope text-body-md uppercase tracking-widest">
          <Link
            href="/rent"
            className="text-primary font-bold border-b-2 border-primary pb-1"
          >
            Fleet
          </Link>
          <Link
            href="/rent"
            className="text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Services
          </Link>
          <Link
            href="/rent"
            className="text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Concierge
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/rent"
            className="flex items-center gap-2 metallic-gradient text-on-primary-fixed font-manrope font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity shadow-lg"
          >
            Book Now
          </Link>
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center w-full pt-24 pb-24">
        {children}
      </main>
      <footer className="w-full mt-auto border-t border-outline-variant/30 bg-surface-container-lowest py-16 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max-width mx-auto">
        <div className="flex items-center gap-2.5 mb-4 md:mb-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a2e]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Premium<span className="text-[#e94560]">Drive</span>
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 font-manrope text-body-md mb-4 md:mb-0">
          <Link href="/rent" className="text-on-surface-variant hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/rent" className="text-on-surface-variant hover:text-primary transition-colors">
            Fleet
          </Link>
          <Link
            href="/rent"
            className="text-primary hover:text-primary transition-colors"
          >
            Contact Us
          </Link>
        </div>
        <div className="text-on-surface-variant font-manrope text-body-md text-center md:text-right">
          &copy; {new Date().getFullYear()} Premium Drive. The Pinnacle of Mobility.
        </div>
      </footer>
      <FloatingChat />
    </div>
  );
}
