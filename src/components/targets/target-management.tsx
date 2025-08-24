'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Edit,
  Save,
  X,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3
} from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { toast } from 'sonner';
import { getAllFiscalYears, currentIndianFY, type FiscalYear } from '@/lib/fy';

interface TargetData {
  id: string;
  state_code: string;
  fiscal_year: string;
  target_amount: number;
  description?: string;
  priority: number;
  previous_year_funding?: number;
  created_at: string;
  updated_at: string;
}

interface ComparisonData {
  state_code: string;
  target_amount: number;
  actual_amount: number;
  difference: number;
  percentage_achieved: number;
  status: 'exceeded' | 'on_track' | 'behind';
  priority: number;
  description?: string;
}

interface TargetManagementProps {
  currentFY: FiscalYear;
  states: Array<{ code: string; name: string }>;
}

export function TargetManagement({ currentFY, states }: TargetManagementProps) {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [selectedFY, setSelectedFY] = useState<FiscalYear>(currentFY);
  const [previousYearFunding, setPreviousYearFunding] = useState<Record<string, number>>({});
  const [availableFiscalYears, setAvailableFiscalYears] = useState<FiscalYear[]>([]);

  // Load all available fiscal years from targets and contributions
  const loadAvailableFiscalYears = async () => {
    try {
      // Get all possible fiscal years (2018 to current + 5 years)
      const allPossibleFYs = getAllFiscalYears();
      
      // Get all targets to extract fiscal years that have data
      const targetsResponse = await fetch('/api/targets');
      const contributionsResponse = await fetch('/api/contributions');
      
      const fiscalYearsWithData = new Set<FiscalYear>();
      
      // Add fiscal years from existing targets
      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        targetsData.targets?.forEach((target: any) => {
          if (target.fiscalYear || target.fiscal_year) {
            const fy = target.fiscalYear || target.fiscal_year;
            if (fy.startsWith('FY') && fy.includes('-')) {
              fiscalYearsWithData.add(fy as FiscalYear);
            }
          }
        });
      }

      // Add fiscal years from existing contributions
      if (contributionsResponse.ok) {
        const contributionsData = await contributionsResponse.json();
        contributionsData.contributions?.forEach((contribution: any) => {
          if (contribution.fiscalYear) {
            const fy = contribution.fiscalYear;
            if (fy.startsWith('FY') && fy.includes('-')) {
              fiscalYearsWithData.add(fy as FiscalYear);
            }
          }
        });
      }

      // Combine all possible FYs with priority for those with data
      const currentFYIndex = allPossibleFYs.findIndex(fy => fy === currentFY);
      const relevantFYs = allPossibleFYs.slice(
        Math.max(0, currentFYIndex - 3), // 3 years before current
        currentFYIndex + 6 // 5 years after current
      );

      // Add any fiscal years with data that might be outside the range
      fiscalYearsWithData.forEach(fy => {
        if (!relevantFYs.includes(fy)) {
          relevantFYs.push(fy);
        }
      });

      // Sort in descending order (newest first)
      const sortedYears = relevantFYs.sort((a, b) => {
        const aYear = parseInt(a.replace('FY', '').split('-')[0]);
        const bYear = parseInt(b.replace('FY', '').split('-')[0]);
        return bYear - aYear;
      });

      setAvailableFiscalYears(sortedYears);
    } catch (error) {
      console.error('Failed to load available fiscal years:', error);
      // Fallback to all fiscal years
      setAvailableFiscalYears(getAllFiscalYears().reverse());
    }
  };

  // Load targets for the selected fiscal year
  const loadTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/targets?action=fiscal-year&fiscalYear=${selectedFY}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        const transformedTargets = data.targets.map((target: any) => ({
          id: `${target.stateCode}-${target.fiscalYear}`,
          state_code: target.stateCode,
          fiscal_year: target.fiscalYear,
          target_amount: target.targetAmount,
          description: `Target for ${target.stateCode} in ${target.fiscalYear}`,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setTargets(transformedTargets);
      }
    } catch (error) {
      console.error('Failed to load targets:', error);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  // Load comparison data
  const loadComparison = async () => {
    try {
      const response = await fetch(`/api/targets?action=comparison&fiscalYear=${selectedFY}`);
      if (response.ok) {
        const data = await response.json();
        setComparison(data.comparison || []);
      }
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  // Initialize targets for all states
  const initializeTargets = async (forceUpdate = false) => {
    try {
      setLoading(true);
      const response = await fetch('/api/targets?action=initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear: selectedFY,
          forceUpdate: forceUpdate
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        await loadTargets();
        await loadComparison();
      } else {
        throw new Error('Failed to initialize targets');
      }
    } catch (error) {
      console.error('Failed to initialize targets:', error);
      toast.error('Failed to initialize targets');
    } finally {
      setLoading(false);
    }
  };

  // Update target amount
  const updateTarget = async (stateCode: string, newAmount: number) => {
    try {
      const response = await fetch(`/api/targets?stateCode=${stateCode}&fiscalYear=${selectedFY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAmount: newAmount
        })
      });

      if (response.ok) {
        toast.success(`Updated target for ${stateCode}`);
        await loadTargets();
        await loadComparison();
        setEditingTarget(null);
      } else {
        throw new Error('Failed to update target');
      }
    } catch (error) {
      console.error('Failed to update target:', error);
      toast.error('Failed to update target');
    }
  };

  // Reset targets to previous year funding
  const resetTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/targets?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear: selectedFY
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        await loadTargets();
        await loadComparison();
      } else {
        throw new Error('Failed to reset targets');
      }
    } catch (error) {
      console.error('Failed to reset targets:', error);
      toast.error('Failed to reset targets');
    } finally {
      setLoading(false);
    }
  };

  // Load previous year funding for all states
  const loadPreviousYearFunding = async () => {
    try {
      const fundingData: Record<string, number> = {};
      
      // Load funding for each state
      for (const state of states) {
        const response = await fetch(`/api/targets?action=previous-year-funding&stateCode=${state.code}&fiscalYear=${selectedFY}`);
        if (response.ok) {
          const data = await response.json();
          fundingData[state.code] = data.previousYearFunding || 0;
        }
      }
      
      setPreviousYearFunding(fundingData);
    } catch (error) {
      console.error('Failed to load previous year funding:', error);
    }
  };

  // Bulk initialize targets for multiple fiscal years
  const handleBulkInitialize = async (selectedYears: FiscalYear[], forceUpdate: boolean = false) => {
    try {
      setLoading(true);
      const results = [];
      
      for (const year of selectedYears) {
        const response = await fetch('/api/targets?action=initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fiscalYear: year,
            forceUpdate: forceUpdate
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ year, success: true, message: data.message });
        } else {
          results.push({ year, success: false, message: `Failed to initialize FY ${year}` });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully initialized targets for ${successCount} fiscal year${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to initialize ${failCount} fiscal year${failCount > 1 ? 's' : ''}`);
      }

      // Reload current data
      await loadTargets();
      await loadComparison();
    } catch (error) {
      console.error('Failed to bulk initialize targets:', error);
      toast.error('Failed to bulk initialize targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
    loadComparison();
    loadPreviousYearFunding();
  }, [selectedFY]);

  useEffect(() => {
    loadAvailableFiscalYears();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'on_track':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'behind':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-green-100 text-green-800';
      case 'on_track':
        return 'bg-blue-100 text-blue-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Target Management</h1>
          <p className="text-slate-600">Manage fundraising targets with automatic previous year defaults</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value as FiscalYear)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm min-w-[120px]"
          >
            {availableFiscalYears.map(year => (
              <option key={year} value={year}>
                {year} {year === currentFY && '(Current)'}
              </option>
            ))}
          </select>
          
          <Button
            onClick={() => initializeTargets(false)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Target className="h-4 w-4 mr-2" />
            Initialize Targets
          </Button>
          
          <Button
            onClick={resetTargets}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Previous Year
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <Target className="h-4 w-4 mr-2" />
                Bulk Initialize
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Initialize Targets for Multiple Years</DialogTitle>
                <DialogDescription>
                  Select fiscal years to initialize targets for all states. This will set targets based on previous year funding.
                </DialogDescription>
              </DialogHeader>
              <BulkInitializeForm 
                fiscalYears={availableFiscalYears}
                currentFY={currentFY}
                onInitialize={handleBulkInitialize}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="targets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="comparison">Target vs Actual</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
          {/* Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => {
              const stateInfo = states.find(s => s.code === target.state_code);
              const isEditing = editingTarget === target.id;
              
              return (
                <Card key={target.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-lg">{stateInfo?.name || target.state_code}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Priority {target.priority}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      FY {target.fiscal_year}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Target Amount */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Target Amount</Label>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="text-sm"
                            placeholder="Enter amount"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateTarget(target.state_code, parseFloat(editAmount))}
                            className="px-2"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTarget(null)}
                            className="px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-green-600">
                            {formatMoney(target.target_amount)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTarget(target.id);
                              setEditAmount(target.target_amount.toString());
                            }}
                            className="px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Previous Year Reference */}
                    {previousYearFunding[target.state_code] !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Previous Year Funding</Label>
                        <div className="text-sm text-slate-600">
                          {formatMoney(previousYearFunding[target.state_code])}
                        </div>
                        {target.target_amount !== previousYearFunding[target.state_code] && (
                          <div className="text-xs text-slate-500">
                            {target.target_amount > previousYearFunding[target.state_code] ? (
                              <span className="text-green-600">
                                +{formatMoney(target.target_amount - previousYearFunding[target.state_code])} increase
                              </span>
                            ) : (
                              <span className="text-red-600">
                                -{formatMoney(previousYearFunding[target.state_code] - target.target_amount)} decrease
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {target.description && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        {target.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {targets.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Targets Set</h3>
              <p className="text-slate-600 mb-4">
                Initialize targets for FY {selectedFY} to get started. Targets will be automatically set based on previous year funding.
              </p>
              <Button onClick={() => initializeTargets(false)} disabled={loading}>
                <Target className="h-4 w-4 mr-2" />
                Initialize Targets
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {comparison.map((item) => {
              const stateInfo = states.find(s => s.code === item.state_code);
              
              return (
                <Card key={item.state_code} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <CardTitle className="text-lg">{stateInfo?.name || item.state_code}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {(item.percentage_achieved || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{(item.percentage_achieved || 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.status === 'exceeded' ? 'bg-green-500' :
                            item.status === 'on_track' ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.percentage_achieved || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-slate-500">Target</Label>
                        <div className="font-medium">{formatMoney(item.target_amount)}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Actual</Label>
                        <div className="font-medium">{formatMoney(item.actual_amount)}</div>
                      </div>
                    </div>

                    {/* Difference */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Difference</span>
                        <span className={`font-medium ${
                          item.difference >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.difference >= 0 ? '+' : ''}{formatMoney(item.difference)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {comparison.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Comparison Data</h3>
              <p className="text-slate-600 mb-4">
                Initialize targets first to see target vs actual comparison.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Bulk Initialize Form Component
interface BulkInitializeFormProps {
  fiscalYears: FiscalYear[];
  currentFY: FiscalYear;
  onInitialize: (selectedYears: FiscalYear[], forceUpdate: boolean) => void;
  loading: boolean;
}

function BulkInitializeForm({ fiscalYears, currentFY, onInitialize, loading }: BulkInitializeFormProps) {
  const [selectedYears, setSelectedYears] = useState<FiscalYear[]>([]);
  const [forceUpdate, setForceUpdate] = useState(false);

  const handleYearToggle = (year: FiscalYear) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleSelectAll = () => {
    setSelectedYears(fiscalYears);
  };

  const handleClearAll = () => {
    setSelectedYears([]);
  };

  const handleSubmit = () => {
    if (selectedYears.length > 0) {
      onInitialize(selectedYears, forceUpdate);
      setSelectedYears([]);
      setForceUpdate(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Select Fiscal Years</Label>
          <div className="space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {fiscalYears.map(year => (
            <label key={year} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => handleYearToggle(year)}
                className="rounded border-gray-300"
              />
              <span className={`text-sm ${year === currentFY ? 'font-medium text-blue-600' : ''}`}>
                {year}
                {year === currentFY && ' (Current)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="forceUpdate"
          checked={forceUpdate}
          onChange={(e) => setForceUpdate(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="forceUpdate" className="text-sm">
          Force update existing targets
        </Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedYears([]);
            setForceUpdate(false);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || selectedYears.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          Initialize {selectedYears.length} Year{selectedYears.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}