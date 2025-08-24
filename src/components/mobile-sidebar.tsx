"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserContext } from "@/lib/user-context";
import { cn } from "@/lib/utils";
import { Menu, X, Home, Building2, MapPin, TrendingUp, Calendar, BarChart3, UserCog, Bot } from "lucide-react";
import { useTransition, useCallback, memo, useMemo, useEffect } from "react";

const getNavigation = (isAdmin: boolean, isRegionalManager: boolean, assignedStates: string[], statesData: any[]) => {
  const baseNavigation = [
    { name: "Overview", href: "/", icon: Home },
    { name: "Funders", href: "/funders", icon: Building2 },
    { name: "States", href: "/states", icon: MapPin },
    { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
    { name: "Fiscal Years", href: "/fy", icon: Calendar },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "AI Assistant", href: "/ai-assistant", icon: Bot },
  ];

  const adminNavigation = [
    { name: "User Management", href: "/admin/users", icon: UserCog },
  ];

  if (isAdmin) {
    return [...baseNavigation, ...adminNavigation];
  }

  if (isRegionalManager && assignedStates.length > 0) {
    return assignedStates.map(stateCode => {
      const stateInfo = statesData.find(s => s.code === stateCode);
      const stateName = stateInfo?.name || stateCode;
      return {
        name: stateName,
        href: `/states/${stateCode}`,
        icon: MapPin,
        badge: stateCode
      };
    });
  }

  return baseNavigation;
};

const MobileNavItem = memo(({ item, pathname, onClick }: { 
  item: any; 
  pathname: string; 
  onClick: () => void; 
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
    startTransition(() => {
      router.push(item.href);
    });
  }, [item.href, router, onClick]);

  return (
    <Button
      variant={pathname === item.href ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-2 text-left",
        pathname === item.href && "bg-secondary",
        isPending && "opacity-50"
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      <item.icon className="h-4 w-4" />
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <Badge variant="outline" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Button>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

interface MobileSidebarProps {
  className?: string;
}

export function MobileSidebar({ className }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statesData, setStatesData] = useState<any[]>([]);
  const pathname = usePathname();
  const { user, isAdmin, isRegionalManager } = useUserContext();

  // Fetch states data for regional managers
  useEffect(() => {
    if (isRegionalManager) {
      fetch('/api/states')
        .then(res => res.json())
        .then(data => setStatesData(data))
        .catch(console.error);
    }
  }, [isRegionalManager]);

  const navigation = useMemo(() => {
    const assignedStates = user?.assignedStates || [];
    return getNavigation(isAdmin, isRegionalManager, assignedStates, statesData);
  }, [isAdmin, isRegionalManager, user?.assignedStates, statesData]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={cn("md:hidden", className)}
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Open navigation</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-80 p-0 h-full max-h-screen overflow-y-auto sm:max-w-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="font-semibold">Navigation</h2>
              <p className="text-xs text-muted-foreground">Vision Empower Trust</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4 space-y-1">
            {navigation.map((item) => (
              <MobileNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onClick={handleClose}
              />
            ))}
          </div>
          
          <div className="p-4 border-t mt-auto">
            <div className="text-xs text-muted-foreground">
              {(user?.firstName || user?.lastName) && (
                <div className="mb-1">Logged in as {user.firstName} {user.lastName}</div>
              )}
              <div>Role: {isAdmin ? 'Admin' : isRegionalManager ? 'Regional Manager' : 'User'}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
