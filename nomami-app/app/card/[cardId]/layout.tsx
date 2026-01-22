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
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
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
  return (
    <>
      <link rel="apple-touch-icon" href="/icon.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
      {children}
    </>
  );
}
