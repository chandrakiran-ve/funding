"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Image,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export interface ExportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  format?: (value: any) => string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  columns: string[];
  includeHeaders: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
  customName?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
}

interface ExportManagerProps {
  data: any[];
  columns: ExportColumn[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  title?: string;
  description?: string;
}

const formatIcons = {
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  pdf: FileText,
  json: File
};

const formatLabels = {
  csv: 'CSV (Comma Separated)',
  xlsx: 'Excel Spreadsheet',
  pdf: 'PDF Document',
  json: 'JSON Data'
};

export function ExportManager({
  data,
  columns,
  isOpen,
  onClose,
  onExport,
  title = "Export Data",
  description = "Choose your export format and options"
}: ExportManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    columns: columns.map(col => col.key),
    includeHeaders: true,
    includeCharts: false,
    includeSummary: true
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('processing');
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('success');
      
      toast.success('Export completed successfully!');
      
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportStatus('idle');
        setExportProgress(0);
      }, 1500);
      
    } catch (error) {
      setExportStatus('error');
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setExportOptions(prev => ({
      ...prev,
      columns: prev.columns.includes(columnKey)
        ? prev.columns.filter(key => key !== columnKey)
        : [...prev.columns, columnKey]
    }));
  };

  const selectAllColumns = () => {
    setExportOptions(prev => ({
      ...prev,
      columns: columns.map(col => col.key)
    }));
  };

  const deselectAllColumns = () => {
    setExportOptions(prev => ({
      ...prev,
      columns: []
    }));
  };

  if (isExporting) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportStatus === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
              {exportStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {exportStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              
              {exportStatus === 'processing' && 'Exporting Data...'}
              {exportStatus === 'success' && 'Export Complete!'}
              {exportStatus === 'error' && 'Export Failed'}
            </DialogTitle>
            <DialogDescription>
              {exportStatus === 'processing' && 'Please wait while we prepare your export.'}
              {exportStatus === 'success' && 'Your file has been downloaded successfully.'}
              {exportStatus === 'error' && 'There was an error processing your export.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Progress value={exportProgress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              {exportProgress}% complete
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formatLabels).map(([format, label]) => {
                const Icon = formatIcons[format as keyof typeof formatIcons];
                return (
                  <div
                    key={format}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      exportOptions.format === format
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: format as any }))}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">{format.toUpperCase()}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Columns to Export</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllColumns}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllColumns}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={exportOptions.columns.includes(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {exportOptions.columns.length} of {columns.length} columns selected
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeaders"
                  checked={exportOptions.includeHeaders}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeHeaders: !!checked }))
                  }
                />
                <Label htmlFor="includeHeaders" className="text-sm">
                  Include column headers
                </Label>
              </div>

              {exportOptions.format === 'pdf' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={exportOptions.includeCharts}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))
                      }
                    />
                    <Label htmlFor="includeCharts" className="text-sm">
                      Include charts and visualizations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSummary"
                      checked={exportOptions.includeSummary}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeSummary: !!checked }))
                      }
                    />
                    <Label htmlFor="includeSummary" className="text-sm">
                      Include summary statistics
                    </Label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="customName" className="text-sm font-medium">
              Custom Filename (optional)
            </Label>
            <Input
              id="customName"
              placeholder="Enter custom filename..."
              value={exportOptions.customName || ''}
              onChange={(e) => 
                setExportOptions(prev => ({ ...prev, customName: e.target.value }))
              }
            />
            <div className="text-xs text-muted-foreground">
              File will be saved as: {exportOptions.customName || `export-${new Date().toISOString().split('T')[0]}`}.{exportOptions.format}
            </div>
          </div>

          {/* Data Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data Preview</Label>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span>{data.length} rows will be exported</span>
                  <Badge variant="secondary">
                    {exportOptions.columns.length} columns
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={exportOptions.columns.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export {formatLabels[exportOptions.format]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export the enhanced utilities
export { exportToCSV, exportToJSON, exportToExcel, testExport } from '@/lib/export-utils';
