import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import {Metadata} from "next";

export const metadata: Metadata = { title: "OTT Backend" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
