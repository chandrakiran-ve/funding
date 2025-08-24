"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface FilterOption {
  id: string;
  label: string;
  value: string | number;
  count?: number;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'checkbox';
  options?: FilterOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface ActiveFilter {
  filterId: string;
  label: string;
  value: any;
  displayValue: string;
}

interface AdvancedFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterConfigs: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFiltersChange: (filters: ActiveFilter[]) => void;
  onExport?: () => void;
  onReset?: () => void;
  resultCount?: number;
  className?: string;
}

export function AdvancedFilters({
  searchTerm,
  onSearchChange,
  filterConfigs,
  activeFilters,
  onFiltersChange,
  onExport,
  onReset,
  resultCount,
  className
}: AdvancedFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});

  // Convert active filters to temp filters format
  const tempFiltersFromActive = useMemo(() => {
    const temp: Record<string, any> = {};
    activeFilters.forEach(filter => {
      temp[filter.filterId] = filter.value;
    });
    return temp;
  }, [activeFilters]);

  const handleFilterChange = (filterId: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  const applyFilters = () => {
    const newActiveFilters: ActiveFilter[] = [];
    
    Object.entries(tempFilters).forEach(([filterId, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const config = filterConfigs.find(f => f.id === filterId);
        if (!config) return;

        let displayValue: string;
        
        if (config.type === 'multiselect' && Array.isArray(value)) {
          displayValue = value.map(v => 
            config.options?.find(opt => opt.value === v)?.label || v
          ).join(', ');
        } else if (config.type === 'select') {
          displayValue = config.options?.find(opt => opt.value === value)?.label || String(value);
        } else if (config.type === 'daterange' && Array.isArray(value)) {
          displayValue = `${format(value[0], 'MMM dd')} - ${format(value[1], 'MMM dd')}`;
        } else if (config.type === 'date') {
          displayValue = format(new Date(value), 'MMM dd, yyyy');
        } else {
          displayValue = String(value);
        }

        newActiveFilters.push({
          filterId,
          label: config.label,
          value,
          displayValue
        });
      }
    });

    onFiltersChange(newActiveFilters);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setTempFilters({});
    onFiltersChange([]);
    setIsFiltersOpen(false);
    onReset?.();
  };

  const removeFilter = (filterId: string) => {
    const newFilters = activeFilters.filter(f => f.filterId !== filterId);
    onFiltersChange(newFilters);
  };

  const renderFilterInput = (config: FilterConfig) => {
    const value = tempFilters[config.id] ?? tempFiltersFromActive[config.id];

    switch (config.type) {
      case 'text':
        return (
          <Input
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => handleFilterChange(config.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleFilterChange(config.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option.id} value={String(option.value)}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({option.count})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {config.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${config.id}-${option.id}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleFilterChange(config.id, newValues);
                  }}
                />
                <Label 
                  htmlFor={`${config.id}-${option.id}`}
                  className="text-sm font-normal flex items-center justify-between flex-1"
                >
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({option.count})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'number':
        return (
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              min={config.min}
              max={config.max}
              value={value?.min || ''}
              onChange={(e) => handleFilterChange(config.id, {
                ...value,
                min: e.target.value ? Number(e.target.value) : undefined
              })}
            />
            <Input
              type="number"
              placeholder="Max"
              min={config.min}
              max={config.max}
              value={value?.max || ''}
              onChange={(e) => handleFilterChange(config.id, {
                ...value,
                max: e.target.value ? Number(e.target.value) : undefined
              })}
            />
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : config.placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFilterChange(config.id, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'daterange':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value && Array.isArray(value) && value.length === 2
                  ? `${format(new Date(value[0]), "MMM dd")} - ${format(new Date(value[1]), "MMM dd")}`
                  : config.placeholder
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{
                  from: value?.[0] ? new Date(value[0]) : undefined,
                  to: value?.[1] ? new Date(value[1]) : undefined
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    handleFilterChange(config.id, [
                      range.from.toISOString(),
                      range.to.toISOString()
                    ]);
                  }
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all fields..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filterConfigs.map((config, index) => (
                    <div key={config.id}>
                      <Label className="text-sm font-medium mb-2 block">
                        {config.label}
                      </Label>
                      {renderFilterInput(config)}
                      {index < filterConfigs.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    className="flex-1"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.filterId}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="font-medium">{filter.label}:</span>
              <span>{filter.displayValue}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => removeFilter(filter.filterId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount === 0 ? 'No results found' : `${resultCount.toLocaleString()} result${resultCount === 1 ? '' : 's'}`}
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}
