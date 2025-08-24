'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { PendingApproval } from "@/components/pending-approval";
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
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <MobileSidebar />
              <div>
                <h1 className="text-base md:text-lg font-semibold">Vision Empower Trust</h1>
                {user && (
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Welcome, {user.firstName || user.email}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 md:p-6">
          {children}
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                  <div className="text-white font-bold text-xl">VE</div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to VE Funds</h1>
                <p className="text-gray-600">Fundraising Intelligence Platform</p>
              </div>
              <div className="space-y-3">
                <SignInButton mode="modal">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
                    Create Account
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </div>
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
