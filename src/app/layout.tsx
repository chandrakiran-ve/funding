import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientLayout } from "@/components/client-layout";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VE Funds - Fundraising Intelligence",
  description: "Vision Empower Trust fundraising dashboard and analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
        >
          <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
            {/* Premium background effects */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/2 to-transparent rounded-full blur-3xl" />
            </div>
            
            <ClientLayout>
              {children}
            </ClientLayout>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'premium-card border-l-4 border-l-primary shadow-premium-lg',
                duration: 4000,
              }}
            />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
