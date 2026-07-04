import type { Metadata } from "next";
import { Montserrat, Manrope, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LanguageProvider } from "@/lib/i18n/language-context";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "optional",
  preload: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "optional",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "optional",
  preload: false,
});

export const metadata: Metadata = {
  title: "CarRental OS",
  description: "Car Rental Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >

      <body className="min-h-full">
        <Providers>
          <LanguageProvider>
            <DashboardShell>
              {children}
            </DashboardShell>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
