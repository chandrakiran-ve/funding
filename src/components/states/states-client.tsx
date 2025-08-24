"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Target, TrendingUp, School, Users, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { AddStateDialog } from "./add-state-dialog";
import { ExportManager, ExportColumn, ExportOptions } from "@/components/ui/export-manager";
import { exportToCSV, exportToJSON, exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";

interface StateMetric {
  code: string;
  name: string;
  coordinator?: string;
  secured: number;
  target: number;
  shortfall: number;
  achievement: number;
  totalSchools: number;
  fundedSchools: number;
  unfundedSchools: number;
  contributions: number;
  status: 'on-track' | 'at-risk' | 'critical';
}

interface StatesClientProps {
  stateMetrics: StateMetric[];
  totalStates: number;
  onTrackStates: number;
  atRiskStates: number;
  criticalStates: number;
  totalSecured: number;
  totalTarget: number;
  totalSchools: number;
  totalFundedSchools: number;
  currentFY: string;
}

export function StatesClient({ 
  stateMetrics: initialStateMetrics,
  totalStates,
  onTrackStates: initialOnTrackStates,
  atRiskStates: initialAtRiskStates,
  criticalStates: initialCriticalStates,
  totalSecured,
  totalTarget,
  totalSchools,
  totalFundedSchools,
  currentFY
}: StatesClientProps) {
  const [stateMetrics, setStateMetrics] = useState(initialStateMetrics);
  const [onTrackStates, setOnTrackStates] = useState(initialOnTrackStates);
  const [atRiskStates, setAtRiskStates] = useState(initialAtRiskStates);
  const [criticalStates, setCriticalStates] = useState(initialCriticalStates);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleStateAdded = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  // Export configurations
  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'State Name', type: 'text' },
    { key: 'code', label: 'State Code', type: 'text' },
    { key: 'coordinator', label: 'Account Manager', type: 'text' },
    { key: 'target', label: 'Target Amount', type: 'currency', format: formatMoney },
    { key: 'secured', label: 'Secured Amount', type: 'currency', format: formatMoney },
    { key: 'achievement', label: 'Achievement Rate', type: 'number', format: (val) => `${val.toFixed(1)}%` },
    { key: 'shortfall', label: 'Shortfall', type: 'currency', format: formatMoney },
    { key: 'totalSchools', label: 'Total Schools', type: 'number' },
    { key: 'fundedSchools', label: 'Funded Schools', type: 'number' },
    { key: 'contributions', label: 'Contributions', type: 'number' },
    { key: 'status', label: 'Status', type: 'text' }
  ];

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log('Starting states export with options:', options);
      toast.info('Preparing export...');
      
      const exportData = stateMetrics.map(state => ({
        name: state.name,
        code: state.code,
        coordinator: state.coordinator || 'N/A',
        target: state.target,
        secured: state.secured,
        achievement: state.achievement,
        shortfall: state.shortfall,
        totalSchools: state.totalSchools,
        fundedSchools: state.fundedSchools,
        contributions: state.contributions,
        status: state.status === 'on-track' ? 'On Track' : 
               state.status === 'at-risk' ? 'At Risk' : 'Critical'
      }));

      console.log('States export data prepared:', { count: exportData.length, sample: exportData[0] });

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
      console.error('States export failed:', error);
      toast.error('Export failed. Please try again.');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">States</h1>
          <p className="text-muted-foreground">
            Track performance across all states for {currentFY}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <AddStateDialog onStateAdded={handleStateAdded} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total States</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStates}</div>
            <p className="text-xs text-muted-foreground">
              {onTrackStates} on track, {criticalStates} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Secured</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney(totalSecured)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSecured / totalTarget) * 100).toFixed(1)}% of target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools Covered</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFundedSchools}</div>
            <p className="text-xs text-muted-foreground">
              of {totalSchools} total schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTarget > 0 ? ((totalSecured / totalTarget) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all states
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Status</CardTitle>
          <CardDescription>
            State-wise achievement status for {currentFY}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{onTrackStates}</div>
                <div className="text-sm text-muted-foreground">On Track (≥80%)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{atRiskStates}</div>
                <div className="text-sm text-muted-foreground">At Risk (50-79%)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{criticalStates}</div>
                <div className="text-sm text-muted-foreground">Critical (&lt;50%)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* States Table */}
      <Card>
        <CardHeader>
          <CardTitle>All States</CardTitle>
          <CardDescription>
            Detailed performance metrics for each state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Secured</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Schools</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stateMetrics.map((state) => (
                <TableRow key={state.code}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{state.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {state.code} • {state.contributions} contributions
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-sm">{state.coordinator || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatMoney(state.target)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      {formatMoney(state.secured)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Shortfall: {formatMoney(state.shortfall)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {state.achievement.toFixed(1)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            state.achievement >= 80 ? 'bg-green-500' :
                            state.achievement >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(state.achievement, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        {state.fundedSchools} funded
                      </div>
                      <div className="text-muted-foreground">
                        of {state.totalSchools} total
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        state.status === 'on-track' ? 'default' :
                        state.status === 'at-risk' ? 'secondary' : 'destructive'
                      }
                    >
                      {state.status === 'on-track' ? 'On Track' :
                       state.status === 'at-risk' ? 'At Risk' : 'Critical'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/states/${state.code}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {stateMetrics.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No states found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first state.
              </p>
              <div className="mt-6">
                <AddStateDialog onStateAdded={handleStateAdded} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Manager */}
      <ExportManager
        data={stateMetrics}
        columns={exportColumns}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export States Data"
        description="Download states performance data in your preferred format"
      />
    </div>
  );
}
