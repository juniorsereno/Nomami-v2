import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#602986',
};

export const metadata: Metadata = {
  title: "Minha Carteirinha - NoMami",
  description: "Carteirinha digital do clube de benefícios NoMami",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NoMami",
  },
};

export default function CardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
