import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sistem Deteksi Anomali Urutan & Waktu Produksi",
  description: "Sistem deteksi anomali urutan dan waktu proses produksi menggunakan metode Isolation Forest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
