import type { Metadata, Viewport } from "next"; // <-- 1. IMPORTAR VIEWPORT
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'] 
});

// 2. O METADATA (AGORA SEM A CHAVE 'viewport')
export const metadata: Metadata = {
  title: "SoftGet - Sistema de Gestão",
  description: "Sistema de gestão de associações.",
};

// 3. O NOVO OBJETO VIEWPORT (SEPARADO)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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