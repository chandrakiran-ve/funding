"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, TrendingUp, Users, MapPin, Download } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { AddFunderDialog } from "./add-funder-dialog";
import { ExportManager, ExportColumn, ExportOptions } from "@/components/ui/export-manager";
import { exportToCSV, exportToJSON, exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FunderMetric {
  id: string;
  name: string;
  type?: string;
  owner?: string;
  currentAmount: number;
  historicalAmount: number;
  stateCount: number;
  contributionCount: number;
  fiscalYears: number;
  status: 'active' | 'inactive';
}

interface FundersClientProps {
  funderMetrics: FunderMetric[];
  activeFunders: number;
  totalCurrentFunding: number;
  totalHistoricalFunding: number;
  currentFY: string;
}

export function FundersClient({ 
  funderMetrics: initialFunderMetrics, 
  activeFunders: initialActiveFunders,
  totalCurrentFunding: initialTotalCurrentFunding,
  totalHistoricalFunding: initialTotalHistoricalFunding,
  currentFY 
}: FundersClientProps) {
  const [funderMetrics, setFunderMetrics] = useState(initialFunderMetrics);
  const [activeFunders, setActiveFunders] = useState(initialActiveFunders);
  const [totalCurrentFunding, setTotalCurrentFunding] = useState(initialTotalCurrentFunding);
  const [totalHistoricalFunding, setTotalHistoricalFunding] = useState(initialTotalHistoricalFunding);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleFunderAdded = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  // Export configurations
  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'Funder Name', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'owner', label: 'Account Manager', type: 'text' },
    { key: 'currentAmount', label: 'Current FY Amount', type: 'currency', format: formatMoney },
    { key: 'historicalAmount', label: 'Historical Total', type: 'currency', format: formatMoney },
    { key: 'stateCount', label: 'States Count', type: 'number' },
    { key: 'contributionCount', label: 'Contributions', type: 'number' },
    { key: 'fiscalYears', label: 'Active Years', type: 'number' },
    { key: 'status', label: 'Status', type: 'text' }
  ];

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log('Starting funders export with options:', options);
      toast.info('Preparing export...');
      
      const exportData = funderMetrics.map(funder => ({
        name: funder.name,
        type: funder.type || 'Unknown',
        owner: funder.owner || 'N/A',
        currentAmount: funder.currentAmount,
        historicalAmount: funder.historicalAmount,
        stateCount: funder.stateCount,
        contributionCount: funder.contributionCount,
        fiscalYears: funder.fiscalYears,
        status: funder.status === 'active' ? 'Active' : 'Inactive'
      }));

      console.log('Funders export data prepared:', { count: exportData.length, sample: exportData[0] });

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
      console.error('Funders export failed:', error);
      toast.error('Export failed. Please try again.');
      throw error;
    }
  };

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      <div className="premium-card-hover p-10 bg-gradient-to-br from-primary/8 via-background to-accent/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Funding Partners
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                <p className="text-xl text-muted-foreground font-semibold">
                  Manage and track all funding relationships and contributions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 status-success">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold">{activeFunders} Active</span>
              </span>
              <span className="flex items-center gap-2 bg-gradient-to-r from-gray-500/25 via-gray-400/20 to-gray-500/25 text-gray-700 dark:text-gray-300 border border-gray-500/40 rounded-full px-4 py-2 font-semibold backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>{funderMetrics.length - activeFunders} Inactive</span>
              </span>
            </div>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setIsExportOpen(true)} 
              className="btn-premium-secondary flex-1 sm:flex-none hover-lift"
            >
              <Download className="mr-2 h-5 w-5" />
              Export Data
            </Button>
            <AddFunderDialog onFunderAdded={handleFunderAdded} />
          </div>
        </div>
      </div>

      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
        <Card className="metric-card-premium hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Funders</CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-3 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {funderMetrics.length}
            </div>
            <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {activeFunders} active this FY
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card-premium hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current FY Funding</CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-3 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {formatMoney(totalCurrentFunding)}
            </div>
            <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              {currentFY}
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card-premium hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Historical Total</CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 shadow-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-3 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {formatMoney(totalHistoricalFunding)}
            </div>
            <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              All-time contributions
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card-premium hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Avg per Funder</CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 shadow-lg">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 mb-3 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {formatMoney(activeFunders > 0 ? totalCurrentFunding / activeFunders : 0)}
            </div>
            <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              This fiscal year
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Funders Table */}
      <Card className="premium-card-hover animate-scale-in">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl font-bold flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                All Funding Partners
              </div>
              <CardDescription className="text-lg font-medium mt-2">
                Complete list of funding partners with current and historical data
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-premium">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funder</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Current FY</TableHead>
                  <TableHead>Historical</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funderMetrics.map((funder) => (
                  <TableRow key={funder.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{funder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {funder.contributionCount} contributions
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{funder.type || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell>{funder.owner || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{funder.stateCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatMoney(funder.currentAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatMoney(funder.historicalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {funder.fiscalYears} FY{funder.fiscalYears !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "font-medium",
                          funder.status === 'active' ? "status-success" : "bg-gray-100 text-gray-600 border-gray-300"
                        )}
                      >
                        {funder.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/funders/${funder.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {funderMetrics.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No funders found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by adding your first funder.
                </p>
                <div className="mt-6">
                  <AddFunderDialog onFunderAdded={handleFunderAdded} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Manager */}
      <ExportManager
        data={funderMetrics}
        columns={exportColumns}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export Funders Data"
        description="Download funders data in your preferred format"
      />
    </div>
  );
}
