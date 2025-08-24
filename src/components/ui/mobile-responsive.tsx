"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Menu, X } from "lucide-react";

// Hook to detect screen size with more granular breakpoints
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Hook for more detailed screen size detection
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}

// Hook for touch device detection
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
}

// Mobile-responsive container
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full px-4 sm:px-6 lg:px-8",
      "max-w-7xl mx-auto",
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-responsive grid
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({ children, className, cols = { default: 1 } }: ResponsiveGridProps) {
  const gridClasses = cn(
    `grid gap-4`,
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Mobile-responsive sidebar
interface MobileSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileSidebar({ children, className }: MobileSidebarProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return <MobileNav className={className}>{children}</MobileNav>;
}

// Mobile-responsive table with enhanced mobile view
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileCardView?: boolean;
}

export function ResponsiveTable({ children, className, mobileCardView = false }: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileCardView) {
    return (
      <div className={cn("space-y-3", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto -mx-2 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized data table
interface MobileDataTableProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  onRowClick?: (row: any) => void;
}

export function MobileDataTable({ data, columns, onRowClick }: MobileDataTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-slate-600">{column.label}:</span>
                <span className="text-sm text-slate-900 text-right">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row, index) => (
            <tr
              key={index}
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mobile-responsive card stack
interface MobileCardStackProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardStack({ children, className }: MobileCardStackProps) {
  return (
    <div className={cn(
      "space-y-4 md:space-y-0",
      "md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4",
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-responsive metrics
interface ResponsiveMetricsProps {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export function ResponsiveMetrics({ metrics }: ResponsiveMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500 truncate">
            {metric.label}
          </div>
          <div className="mt-1 text-lg md:text-2xl font-semibold text-gray-900">
            {metric.value}
          </div>
          {metric.change && (
            <div className={cn(
              "mt-1 text-xs",
              metric.trend === 'up' && "text-green-600",
              metric.trend === 'down' && "text-red-600",
              metric.trend === 'neutral' && "text-gray-500"
            )}>
              {metric.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Mobile-responsive tabs
interface ResponsiveTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  defaultTab?: string;
}

export function ResponsiveTabs({ tabs, defaultTab }: ResponsiveTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <div>
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}