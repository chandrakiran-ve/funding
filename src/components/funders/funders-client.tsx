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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funders</h1>
          <p className="text-muted-foreground">
            Manage and track all funding partners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
          <AddFunderDialog onFunderAdded={handleFunderAdded} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funders</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funderMetrics.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeFunders} active this FY
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current FY Funding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney(totalCurrentFunding)}</div>
            <p className="text-xs text-muted-foreground">
              {currentFY}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historical Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalHistoricalFunding)}</div>
            <p className="text-xs text-muted-foreground">
              All-time contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Funder</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(activeFunders > 0 ? totalCurrentFunding / activeFunders : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This fiscal year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Funders</CardTitle>
          <CardDescription>
            Complete list of funding partners with current and historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      variant={funder.status === 'active' ? 'default' : 'secondary'}
                    >
                      {funder.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/funders/${funder.id}`}>
                      <Button variant="ghost" size="sm">
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
