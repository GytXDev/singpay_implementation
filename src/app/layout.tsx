import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Implémentation API Singpay | Paiement Mobile Money",
  description: "Implémentation de l'API Singpay pour les paiements Mobile Money (Airtel Money et Moov Money) au Gabon.",
  keywords: ["Implémentation", "Paiement", "Mobile Money", "Airtel Money", "Moov Money", "Gabon", "Singpay", "API"],
  authors: [{ name: "Japhet LEYALANGOYE" }],
  openGraph: {
    title: "Implémentation API Singpay | Paiement Mobile Money",
    description: "Implémentation de l'API Singpay.",
    type: "website",
    locale: "fr_FR",
    siteName: "Intégration Singpay",
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon.ico' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/favicon_io/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col font-light text-gray-900`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
