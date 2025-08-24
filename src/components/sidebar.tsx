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
    <div className="flex h-full w-64 flex-col sidebar-premium shadow-premium">
      <div className="flex h-16 items-center border-b border-sidebar-border/30 px-6 bg-gradient-to-r from-sidebar-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
            <PieChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/80 bg-clip-text text-transparent">VE Funds</span>
            <div className="text-xs text-sidebar-foreground/60 font-medium">Intelligence Platform</div>
          </div>
        </div>
      </div>

      {user && (
        <div className="border-b border-sidebar-border/30 p-4 bg-gradient-to-r from-sidebar-accent/20 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            {isAdmin && (
              <Badge className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                <Shield className="w-3 h-3 mr-1" />Admin
              </Badge>
            )}
            {isRegionalManager && (
              <Badge className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                <MapPin className="w-3 h-3 mr-1" />Regional Manager
              </Badge>
            )}
          </div>
          {isRegionalManager && assignedStates.length > 0 && (
            <div className="text-xs text-sidebar-foreground/70 font-medium bg-sidebar-accent/30 rounded-md px-2 py-1">
              States: {assignedStates.join(', ')}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-2 p-4 scrollbar-premium overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "nav-item-premium w-full justify-start gap-3 h-11",
                  isActive && "active bg-gradient-to-r from-sidebar-primary/15 to-sidebar-primary/5 text-sidebar-primary border-l-2 border-sidebar-primary shadow-sm",
                  isPending && "opacity-50"
                )}
                onClick={() => handleNavigation(item.href)}
                disabled={isPending}
              >
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isActive ? "bg-sidebar-primary/20 text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className={cn(
                  "font-medium transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                )}>
                  {item.name}
                </span>
              </Button>
            );
          })}
        </div>

        {!isRegionalManager && (
          <div className="pt-6">
            <div className="mb-3 px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider bg-sidebar-accent/20 rounded-md py-2">
              Quick Access
            </div>
            <div className="space-y-1">
              {quickLinks.map((item) => (
                <Button 
                  key={item.name}
                  variant="ghost" 
                  className={cn(
                    "w-full justify-between h-10 px-3 hover:bg-sidebar-accent/30 transition-all duration-200 group",
                    isPending && "opacity-50"
                  )}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isPending}
                >
                  <span className="text-sm font-medium text-sidebar-foreground/80 group-hover:text-sidebar-foreground">{item.name}</span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs border-0 font-medium",
                      item.status === "current" && "status-success",
                      item.status === "warning" && "status-warning",
                      item.status === "info" && "bg-sidebar-primary/10 text-sidebar-primary"
                    )}
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

      <div className="border-t border-sidebar-border/30 p-4 bg-gradient-to-r from-sidebar-accent/10 to-transparent">
        <Button variant="outline" size="sm" className="w-full h-10 border-sidebar-border/50 hover:bg-sidebar-accent/30 hover:border-sidebar-primary/30 transition-all duration-200 group">
          <Settings className="mr-2 h-4 w-4 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors" />
          <span className="font-medium">Settings</span>
        </Button>
      </div>
    </div>
  );
}

export const Sidebar = memo(SidebarComponent);

