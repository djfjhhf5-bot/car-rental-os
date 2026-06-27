import type { Metadata } from "next";
import { Montserrat, Manrope, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full">
        <Providers>
          <DashboardShell>
            {children}
          </DashboardShell>
        </Providers>
      </body>
    </html>
  );
}
