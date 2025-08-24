"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { ResponsiveContainer, ResponsiveGrid, ResponsiveMetrics, useIsMobile } from "@/components/ui/mobile-responsive";
import { AdvancedFilters, FilterConfig, ActiveFilter } from "@/components/ui/advanced-filters";
import { ExportManager, ExportColumn, ExportOptions } from "@/components/ui/export-manager";
import { exportToCSV, exportToJSON, exportToExcel } from "@/lib/export-utils";
import { FundraisingAnalytics } from "@/components/analytics/fundraising-analytics";
import { toast } from "sonner";

interface OverviewData {
  states: any[];
  contributions: any[];
  targets: any[];
  funders: any[];
  prospects: any[];
  currentFY: string;
}

interface EnhancedOverviewProps {
  data: OverviewData;
}

export function EnhancedOverview({ data }: EnhancedOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();

  const { states, contributions, targets, funders, prospects, currentFY } = data;

  // Current FY calculations
  const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
  const currentTargets = targets.filter(t => t.fiscalYear === currentFY);
  
  const totalSecured = currentContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalTarget = currentTargets.reduce((sum, t) => sum + t.targetAmount, 0);
  const shortfall = Math.max(totalTarget - totalSecured, 0);
  const achievementRate = totalTarget > 0 ? (totalSecured / totalTarget) * 100 : 0;

  // Pipeline calculations
  const pipelineValue = prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
  const weightedPipeline = prospects.reduce((sum, p) => sum + (p.estimatedAmount * (p.probability || 0)), 0);

  // State performance analysis with filtering
  const statePerformance = useMemo(() => {
    let filtered = states.map(state => {
      const stateContribs = currentContributions.filter(c => c.stateCode === state.code);
      const stateTargets = currentTargets.filter(t => t.stateCode === state.code);
      const secured = stateContribs.reduce((sum, c) => sum + c.amount, 0);
      const target = stateTargets.reduce((sum, t) => sum + t.targetAmount, 0);
      const achievement = target > 0 ? (secured / target) * 100 : 0;
      
      return {
        ...state,
        secured,
        target,
        achievement,
        shortfall: Math.max(target - secured, 0),
        status: achievement >= 80 ? 'on-track' : achievement >= 50 ? 'at-risk' : 'critical'
      };
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(state => 
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.coordinator?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters
    activeFilters.forEach(filter => {
      switch (filter.filterId) {
        case 'status':
          filtered = filtered.filter(state => state.status === filter.value);
          break;
        case 'coordinator':
          filtered = filtered.filter(state => state.coordinator === filter.value);
          break;
        case 'achievement':
          const [min, max] = filter.value;
          filtered = filtered.filter(state => 
            state.achievement >= (min || 0) && state.achievement <= (max || 100)
          );
          break;
      }
    });

    return filtered.sort((a, b) => b.achievement - a.achievement);
  }, [states, currentContributions, currentTargets, searchTerm, activeFilters]);

  const onTrackStates = statePerformance.filter(s => s.status === 'on-track').length;
  const atRiskStates = statePerformance.filter(s => s.status === 'at-risk').length;
  const criticalStates = statePerformance.filter(s => s.status === 'critical').length;

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      id: 'status',
      label: 'Performance Status',
      type: 'select',
      options: [
        { id: 'on-track', label: 'On Track', value: 'on-track', count: onTrackStates },
        { id: 'at-risk', label: 'At Risk', value: 'at-risk', count: atRiskStates },
        { id: 'critical', label: 'Critical', value: 'critical', count: criticalStates }
      ]
    },
    {
      id: 'coordinator',
      label: 'Account Manager',
      type: 'multiselect',
      options: Array.from(new Set(states.map(s => s.coordinator).filter(Boolean))).map(coord => ({
        id: coord,
        label: coord,
        value: coord,
        count: states.filter(s => s.coordinator === coord).length
      }))
    },
    {
      id: 'achievement',
      label: 'Achievement Rate (%)',
      type: 'number',
      min: 0,
      max: 100
    }
  ];

  // Export configurations
  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'State Name', type: 'text' },
    { key: 'code', label: 'State Code', type: 'text' },
    { key: 'coordinator', label: 'Account Manager', type: 'text' },
    { key: 'target', label: 'Target Amount', type: 'currency', format: formatMoney },
    { key: 'secured', label: 'Secured Amount', type: 'currency', format: formatMoney },
    { key: 'achievement', label: 'Achievement Rate', type: 'number', format: (val) => `${val.toFixed(1)}%` },
    { key: 'shortfall', label: 'Shortfall', type: 'currency', format: formatMoney },
    { key: 'status', label: 'Status', type: 'text' }
  ];

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log('Starting export with options:', options);
      toast.info('Preparing export...');
      
      const exportData = statePerformance.map(state => ({
        name: state.name,
        code: state.code,
        coordinator: state.coordinator || 'N/A',
        target: state.target,
        secured: state.secured,
        achievement: state.achievement,
        shortfall: state.shortfall,
        status: state.status
      }));

      console.log('Export data prepared:', { count: exportData.length, sample: exportData[0] });

      switch (options.format) {
        case 'csv':
          exportToCSV(exportData, exportColumns, options);
          toast.success('CSV file downloaded successfully!');
          break;
        case 'json':
          exportToJSON(exportData, exportColumns, options);
          toast.success('JSON file downloaded successfully!');
          break;
        case 'xlsx':
          exportToExcel(exportData, exportColumns, options);
          toast.success('Excel file downloaded successfully!');
          break;
        default:
          throw new Error(`Export format ${options.format} not yet implemented`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
      throw error;
    }
  };

  // Key metrics for responsive display
  const keyMetrics = [
    {
      label: "Total Target",
      value: formatMoney(totalTarget),
      change: "+12.5%",
      trend: 'up' as const
    },
    {
      label: "Secured",
      value: formatMoney(totalSecured),
      change: `${achievementRate.toFixed(1)}%`,
      trend: achievementRate >= 75 ? 'up' as const : 'neutral' as const
    },
    {
      label: "Shortfall",
      value: formatMoney(shortfall),
      change: "-8.2%",
      trend: 'down' as const
    },
    {
      label: "Pipeline",
      value: formatMoney(weightedPipeline),
      change: "+15.3%",
      trend: 'up' as const
    }
  ];

  return (
    <ResponsiveContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fundraising Overview</h1>
          <p className="text-muted-foreground">
            Vision Empower Trust • Fiscal Year {currentFY}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExportOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            onClick={() => setActiveTab("analytics")}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics - Mobile Responsive */}
      <ResponsiveMetrics metrics={keyMetrics} />

      {/* Advanced Filters */}
      <AdvancedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterConfigs={filterConfigs}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        onExport={() => setIsExportOpen(true)}
        resultCount={statePerformance.length}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={
          isMobile ? "grid w-full grid-cols-2" : "grid w-full grid-cols-4"
        }>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="funders">Funders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
            {/* State Performance Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>State Performance Summary</CardTitle>
                <CardDescription>
                  Achievement rates across {states.length} operational states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{onTrackStates}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      On Track
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{atRiskStates}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      At Risk
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{criticalStates}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Critical
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {statePerformance.slice(0, 5).map((state) => (
                    <div key={state.code} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{state.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {state.coordinator}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {state.achievement.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatMoney(state.secured)}
                          </div>
                        </div>
                        <Badge 
                          variant={
                            state.status === 'on-track' ? 'default' :
                            state.status === 'at-risk' ? 'secondary' : 'destructive'
                          }
                        >
                          {state.status === 'on-track' ? 'On Track' :
                           state.status === 'at-risk' ? 'At Risk' : 'Critical'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pipeline Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatMoney(pipelineValue)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Pipeline</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {formatMoney(weightedPipeline)}
                    </div>
                    <div className="text-sm text-muted-foreground">Weighted Value</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{prospects.length}</div>
                    <div className="text-sm text-muted-foreground">Active Prospects</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funder Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-2xl font-bold">{funders.length}</div>
                    <div className="text-sm text-muted-foreground mb-4">Active Funders</div>
                  </div>
                  <div className="space-y-2">
                    {funders.slice(0, 3).map((funder) => {
                      const funderContribs = currentContributions.filter(c => c.funderId === funder.id);
                      const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
                      
                      return (
                        <div key={funder.id} className="flex justify-between items-center">
                          <div className="text-sm font-medium truncate">{funder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatMoney(totalAmount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResponsiveGrid>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed State Performance</CardTitle>
              <CardDescription>
                Showing {statePerformance.length} of {states.length} states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statePerformance.map((state) => (
                  <div key={state.code} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                    <div className="flex items-center gap-4 flex-1">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{state.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {state.coordinator} • {state.code}
                        </div>
                        <div className="text-sm">
                          {formatMoney(state.secured)} / {formatMoney(state.target)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {state.achievement.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatMoney(state.shortfall)} shortfall
                        </div>
                      </div>
                      <Badge 
                        variant={
                          state.status === 'on-track' ? 'default' :
                          state.status === 'at-risk' ? 'secondary' : 'destructive'
                        }
                      >
                        {state.status === 'on-track' ? 'On Track' :
                         state.status === 'at-risk' ? 'At Risk' : 'Critical'}
                      </Badge>
                      <Link href={`/states/${state.code}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Funders</CardTitle>
              <CardDescription>
                {funders.length} funders supporting our initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funders.map((funder) => {
                  const funderContribs = currentContributions.filter(c => c.funderId === funder.id);
                  const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
                  const stateCount = new Set(funderContribs.map(c => c.stateCode)).size;
                  
                  return (
                    <div key={funder.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{funder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stateCount} states • {funder.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatMoney(totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">This FY</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FundraisingAnalytics 
            data={{
              contributions,
              targets,
              prospects,
              funders,
              states
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Export Manager */}
      <ExportManager
        data={statePerformance}
        columns={exportColumns}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export State Performance Data"
        description="Download state performance data in your preferred format"
      />
    </ResponsiveContainer>
  );
}
