import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import DisableDevtoolWrapper from "@/components/DisableDevtoolWrapper";
import { Analytics } from "@vercel/analytics/react";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hapixflix",
  description: "Watch your favorite movies and series on Hapixflix.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full w-full overflow-x-hidden",
        "antialiased",
        inter.className,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col w-full overflow-x-hidden">
        <DisableDevtoolWrapper />
        <Toaster />
        <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden">
          <main>{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
