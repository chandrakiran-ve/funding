"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUserContext } from "@/lib/user-context";
import { cn } from "@/lib/utils";
import { Menu, X, Home, Building2, MapPin, Target, TrendingUp, Calendar, BarChart3, UserCog, Bot } from "lucide-react";
import { useTransition, useCallback, memo, useMemo, useEffect } from "react";

const getNavigation = (isAdmin: boolean, isRegionalManager: boolean, assignedStates: string[], statesData: any[]) => {
  const baseNavigation = [
    { name: "Overview", href: "/", icon: Home },
    { name: "Funders", href: "/funders", icon: Building2 },
    { name: "States", href: "/states", icon: MapPin },
    { name: "Targets", href: "/targets", icon: Target },
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

  const isActive = pathname === item.href;

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 text-left py-3 px-3 h-auto",
        isActive && "bg-blue-50 text-blue-700 border border-blue-200",
        !isActive && "hover:bg-slate-50",
        isPending && "opacity-50"
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      <item.icon className={cn(
        "h-5 w-5 flex-shrink-0",
        isActive ? "text-blue-600" : "text-slate-500"
      )} />
      <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
      {item.badge && (
        <Badge variant="outline" className="ml-auto text-xs">
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
        <DialogContent className="w-full max-w-sm p-0 h-full max-h-screen overflow-y-auto">
          <DialogTitle className="sr-only">Main Navigation</DialogTitle>
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VE</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Navigation</h2>
                <p className="text-xs text-slate-600">Vision Empower Trust</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="hover:bg-white/50">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-3 space-y-1 flex-1">
            {navigation.map((item) => (
              <MobileNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onClick={handleClose}
              />
            ))}
          </div>
          
          <div className="p-4 border-t bg-slate-50 mt-auto">
            <div className="text-xs text-slate-600">
              {(user?.firstName || user?.lastName) && (
                <div className="mb-1 font-medium">Logged in as {user.firstName} {user.lastName}</div>
              )}
              <div className="flex items-center justify-between">
                <span>Role: {isAdmin ? 'Admin' : isRegionalManager ? 'Regional Manager' : 'User'}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
