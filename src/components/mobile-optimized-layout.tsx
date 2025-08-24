'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  Menu, 
  Search, 
  Bell, 
  Settings,
  Home,
  BarChart3,
  Users,
  MapPin,
  TrendingUp,
  Calendar,
  Bot
} from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function MobileOptimizedLayout({ 
  children, 
  title, 
  showBackButton = false, 
  onBack,
  actions 
}: MobileOptimizedLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className={cn(
        "sticky top-0 z-50 bg-white border-b transition-all duration-200",
        isScrolled && "shadow-sm"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-900 truncate">
                {title || 'Vision Empower Trust'}
              </h1>
              <div className="text-xs text-slate-500">
                Fundraising Intelligence
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {actions}
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          <MobileNavItem
            href="/"
            icon={Home}
            label="Home"
            isActive={pathname === '/'}
          />
          <MobileNavItem
            href="/analytics"
            icon={BarChart3}
            label="Analytics"
            isActive={pathname === '/analytics'}
          />
          <MobileNavItem
            href="/funders"
            icon={Users}
            label="Funders"
            isActive={pathname === '/funders'}
          />
          <MobileNavItem
            href="/states"
            icon={MapPin}
            label="States"
            isActive={pathname.startsWith('/states')}
          />
          <MobileNavItem
            href="/ai-assistant"
            icon={Bot}
            label="AI"
            isActive={pathname === '/ai-assistant'}
            badge="New"
          />
        </div>
      </nav>
    </div>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  badge?: string;
}

function MobileNavItem({ href, icon: Icon, label, isActive, badge }: MobileNavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
        isActive 
          ? "bg-blue-50 text-blue-600" 
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className={cn(
        "h-5 w-5 mb-1",
        isActive ? "text-blue-600" : "text-slate-500"
      )} />
      <span className={cn(
        "text-xs font-medium",
        isActive ? "text-blue-600" : "text-slate-600"
      )}>
        {label}
      </span>
      {badge && (
        <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 bg-red-500 text-white">
          {badge}
        </Badge>
      )}
    </a>
  );
}

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function MobileCard({ children, className, padding = 'md' }: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <Card className={cn("bg-white shadow-sm border-0", className)}>
      <CardContent className={paddingClasses[padding]}>
        {children}
      </CardContent>
    </Card>
  );
}

// Mobile-optimized metrics grid
interface MobileMetricsProps {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export function MobileMetrics({ metrics }: MobileMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {metrics.map((metric, index) => (
        <MobileCard key={index} padding="sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-600 truncate mb-1">
                {metric.label}
              </div>
              <div className="text-lg font-bold text-slate-900 truncate">
                {metric.value}
              </div>
              {metric.change && (
                <div className={cn(
                  "text-xs font-medium",
                  metric.trend === 'up' && "text-green-600",
                  metric.trend === 'down' && "text-red-600",
                  metric.trend === 'neutral' && "text-slate-500"
                )}>
                  {metric.change}
                </div>
              )}
            </div>
            {metric.icon && (
              <metric.icon className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
            )}
          </div>
        </MobileCard>
      ))}
    </div>
  );
}

// Mobile-optimized list component
interface MobileListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;
    badge?: string;
    onClick?: () => void;
  }>;
}

export function MobileList({ items }: MobileListProps) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
          onClick={item.onClick}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {item.title}
            </div>
            {item.subtitle && (
              <div className="text-xs text-slate-500 truncate">
                {item.subtitle}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {item.value && (
              <div className="text-sm font-medium text-slate-900">
                {item.value}
              </div>
            )}
            {item.badge && (
              <Badge variant="outline" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}