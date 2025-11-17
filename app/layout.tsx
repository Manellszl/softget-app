import type { Metadata } from "next";
import { Geist } from "next/font/google"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'] 
});

export const metadata: Metadata = {
  title: "SoftGet - Sistema de Gestão",
  description: "Sistema de gestão de associações.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`
          ${geistSans.variable} 
          antialiased 
          bg-gray-50 
          text-gray-900 
          text-[15px] 
          font-light
        `}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}