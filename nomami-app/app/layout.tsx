import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import { SessionProvider } from "@/components/auth/session-provider";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoMami - Clube de Benefícios",
  description: "Sistema de gerenciamento do clube de benefícios NoMami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
      >
        <PageTransitionProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
