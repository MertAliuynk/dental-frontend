import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useEffect, useState } from "react";
import LoadingScreen from "@/app/components/LoadingScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karadeniz Diş Ağız ve Diş Sağlığı Polikliniği",
  description: "Karadeniz Diş Ağız ve Diş Sağlığı Polikliniği web sitesi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simülasyon: Giriş sonrası global veriler çekiliyor
    // Burada gerçek API çağrıları yapılabilir
    const fetchGlobalData = async () => {
      // Örnek: kullanıcı, şube, doktorlar, vs. fetch
      await new Promise((resolve) => setTimeout(resolve, 1800)); // Simülasyon için 1.8sn beklet
      setLoading(false);
    };
    fetchGlobalData();
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {loading ? <LoadingScreen /> : children}
      </body>
    </html>
  );
}
