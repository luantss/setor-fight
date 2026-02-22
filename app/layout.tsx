import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JJ — Plataforma de Competições de Jiu-Jitsu",
  description:
    "Inscreva-se em competições de Jiu-Jitsu e tenha sua categoria atribuída automaticamente conforme as regras da CBJJO 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} antialiased bg-white`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
