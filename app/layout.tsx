import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance Management System",
  description: "School Attendance Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <SessionProvider>
          <ToastProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
