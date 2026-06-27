import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RobotiKU - Belajar Robotik Jadi Seru!",
  description:
    "Kelas robotika anak yang interaktif dan menyenangkan. Kembangkan kreativitas & problem solving bersama mentor berpengalaman.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="bg-background text-on-surface font-body antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}