'use client';

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { PendingApproval } from "@/components/pending-approval";
import { LandingPage } from "@/components/landing-page";
import { UserProvider, useUserContext } from "@/lib/user-context";
import { useEffect, useState } from "react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isPending, isApproved } = useUserContext();
  
  // Warm cache on first load
  useEffect(() => {
    if (isApproved && !isLoading) {
      // Warm cache in background
      fetch('/api/cache/warm').catch(console.error);
    }
  }, [isApproved, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show pending approval screen if user is pending
  if (isPending) {
    return <PendingApproval />;
  }

  // Show access denied if user is rejected or not approved
  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <div className="text-red-600 font-bold text-xl">!</div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">Your account access has been restricted</p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Please contact your administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show main dashboard for approved users
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <MobileSidebar />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-lg font-semibold truncate">Vision Empower Trust</h1>
                {user && (
                  <div className="text-xs md:text-sm text-muted-foreground truncate">
                    Welcome, {user.firstName || user.email}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 md:w-10 md:h-10"
                  }
                }}
              />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <UserProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </UserProvider>
      </SignedIn>
    </>
  );
}
