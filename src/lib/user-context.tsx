'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { User } from '@/types/user';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isRegionalManager: boolean;
  isPending: boolean;
  isApproved: boolean;
  assignedStates: string[];
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!clerkUser?.id) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        cache: 'force-cache', // Cache the response
        next: { revalidate: 300 } // Revalidate every 5 minutes (increased from 2)
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error('Failed to fetch user data');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser?.id]);

  useEffect(() => {
    if (isLoaded && clerkUser?.id) {
      fetchUser();
    }
  }, [clerkUser?.id, isLoaded, fetchUser]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const contextValue: UserContextType = useMemo(() => ({
    user,
    isLoading: isLoading || !isLoaded,
    isAdmin: user?.role === 'admin' && user?.status === 'approved',
    isRegionalManager: user?.role === 'regional_manager' && user?.status === 'approved',
    isPending: user?.status === 'pending',
    isApproved: user?.status === 'approved',
    assignedStates: user?.assignedStates || [],
    refreshUser,
  }), [user, isLoading, isLoaded, refreshUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
