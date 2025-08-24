"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserContext } from "@/lib/user-context";
import { memo, useMemo, useCallback, useTransition, useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  TrendingUp,
  Calendar,
  BarChart3,
  Users,
  Target,
  PieChart,
  Settings,
  Home,
  Shield,
  UserCog,
  Bot,
} from "lucide-react";

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
    // Regional managers only see their assigned states
    const stateNavigation = assignedStates.map(stateCode => {
      const stateInfo = statesData.find(s => s.code === stateCode);
      const stateName = stateInfo?.name || stateCode;
      return {
        name: stateName,
        href: `/states/${stateCode}`,
        icon: MapPin,
        isStateTab: true
      };
    });
    
    return stateNavigation;
  }

  return baseNavigation;
};

const quickLinks = [
  { name: "Top Funders", href: "/funders?sort=amount", status: "info" },
  { name: "At Risk States", href: "/states?filter=at-risk", status: "warning" },
  { name: "Current FY", href: "/fy", status: "current" },
  { name: "Analytics", href: "/analytics", status: "info" },
];

function SidebarComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user, isAdmin, isRegionalManager, assignedStates } = useUserContext();
  const [statesData, setStatesData] = useState<any[]>([]);

  // Fetch states data for regional managers
  useEffect(() => {
    const fetchStates = async () => {
      if (isRegionalManager && assignedStates.length > 0) {
        try {
          const response = await fetch('/api/states');
          if (response.ok) {
            const states = await response.json();
            setStatesData(states);
          }
        } catch (error) {
          console.error('Error fetching states:', error);
          // Fallback to basic state data
          const fallbackStates = assignedStates.map(code => ({
            code,
            name: code,
            coordinator: ''
          }));
          setStatesData(fallbackStates);
        }
      }
    };

    fetchStates();
  }, [isRegionalManager, assignedStates]);

  const navigation = useMemo(
    () => getNavigation(isAdmin, isRegionalManager, assignedStates, statesData),
    [isAdmin, isRegionalManager, assignedStates, statesData]
  );

  const handleNavigation = useCallback((href: string) => {
    startTransition(() => {
      router.push(href);
    });
  }, [router]);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <PieChart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">VE Funds</span>
        </div>
      </div>

      {user && (
        <div className="border-b p-4">
          <div className="flex items-center gap-2 mb-2">
            {isAdmin && <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
            {isRegionalManager && <Badge className="bg-blue-100 text-blue-800"><MapPin className="w-3 h-3 mr-1" />Regional Manager</Badge>}
          </div>
          {isRegionalManager && assignedStates.length > 0 && (
            <div className="text-xs text-muted-foreground">
              States: {assignedStates.join(', ')}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-colors duration-200",
                  isActive && "bg-secondary",
                  isPending && "opacity-50"
                )}
                onClick={() => handleNavigation(item.href)}
                disabled={isPending}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {!isRegionalManager && (
          <div className="pt-6">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quick Access
            </div>
            <div className="space-y-1">
              {quickLinks.map((item) => (
                <Button 
                  key={item.name}
                  variant="ghost" 
                  className={cn(
                    "w-full justify-between transition-colors duration-200",
                    isPending && "opacity-50"
                  )}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isPending}
                >
                  <span className="text-sm">{item.name}</span>
                  <Badge 
                    variant={
                      item.status === "current" ? "default" :
                      item.status === "warning" ? "destructive" :
                      "secondary"
                    }
                    className="text-xs"
                  >
                    {item.status === "current" ? "Current" :
                     item.status === "upcoming" ? "Next" :
                     item.status === "warning" ? "Alert" : "Info"}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t p-4">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}

export const Sidebar = memo(SidebarComponent);

