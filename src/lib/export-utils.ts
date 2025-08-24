// Enhanced export utilities with better browser compatibility

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

// Enhanced CSV export with better compatibility
export const exportToCSV = (data: any[], columns: ExportColumn[], options: ExportOptions): void => {
  try {
    console.log('Starting CSV export...', { dataLength: data.length, columns: options.columns });
    
    const selectedColumns = columns.filter(col => options.columns.includes(col.key));
    
    const headers = options.includeHeaders 
      ? selectedColumns.map(col => col.label)
      : [];
    
    const rows = data.map(item => 
      options.columns.map(colKey => {
        const column = columns.find(col => col.key === colKey);
        const value = item[colKey];
        let formattedValue = '';
        
        if (value !== undefined && value !== null) {
          if (column?.format) {
            formattedValue = column.format(value);
          } else {
            formattedValue = String(value);
          }
        }
        
        // Escape CSV special characters
        if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
          formattedValue = `"${formattedValue.replace(/"/g, '""')}"`;
        }
        
        return formattedValue;
      })
    );

    const csvContent = [
      ...(options.includeHeaders ? [headers] : []),
      ...rows
    ].map(row => row.join(',')).join('\n');

    console.log('CSV content generated, length:', csvContent.length);

    // Create and download file
    downloadFile(csvContent, `${options.customName || 'export'}.csv`, 'text/csv');
    
  } catch (error) {
    console.error('CSV export failed:', error);
    throw error;
  }
};

// Enhanced JSON export
export const exportToJSON = (data: any[], columns: ExportColumn[], options: ExportOptions): void => {
  try {
    console.log('Starting JSON export...', { dataLength: data.length, columns: options.columns });
    
    const filteredData = data.map(item => {
      const filtered: any = {};
      options.columns.forEach(colKey => {
        const column = columns.find(col => col.key === colKey);
        const value = item[colKey];
        
        if (column?.format && value !== undefined && value !== null) {
          // For JSON, we might want both raw and formatted values
          filtered[colKey] = {
            raw: value,
            formatted: column.format(value)
          };
        } else {
          filtered[colKey] = value;
        }
      });
      return filtered;
    });

    const jsonContent = JSON.stringify(filteredData, null, 2);
    console.log('JSON content generated, length:', jsonContent.length);

    // Create and download file
    downloadFile(jsonContent, `${options.customName || 'export'}.json`, 'application/json');
    
  } catch (error) {
    console.error('JSON export failed:', error);
    throw error;
  }
};

// Cross-browser compatible file download
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  try {
    console.log('Attempting to download file:', filename, 'Size:', content.length);
    
    // Method 1: Try using Blob and URL.createObjectURL (modern browsers)
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('File download initiated successfully');
      return;
    }
    
    // Method 2: Fallback for older browsers using data URL
    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('File download initiated via data URL');
    
  } catch (error) {
    console.error('File download failed:', error);
    
    // Method 3: Final fallback - open in new window
    try {
      const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
      const newWindow = window.open(dataUrl, '_blank');
      if (newWindow) {
        console.log('File opened in new window as fallback');
      } else {
        throw new Error('Popup blocked');
      }
    } catch (fallbackError) {
      console.error('All download methods failed:', fallbackError);
      // Show the content in an alert as last resort
      alert(`Export failed. Content:\n\n${content.substring(0, 500)}...`);
    }
  }
};

// Excel export (simplified - creates CSV with .xlsx extension)
export const exportToExcel = (data: any[], columns: ExportColumn[], options: ExportOptions): void => {
  const excelOptions = { ...options, customName: `${options.customName || 'export'}.xlsx` };
  exportToCSV(data, columns, excelOptions);
};

// Test function to verify export functionality
export const testExport = (): void => {
  const testData = [
    { name: 'Test 1', value: 100 },
    { name: 'Test 2', value: 200 }
  ];
  
  const testColumns: ExportColumn[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'value', label: 'Value', type: 'number' }
  ];
  
  const testOptions: ExportOptions = {
    format: 'csv',
    columns: ['name', 'value'],
    includeHeaders: true,
    customName: 'test-export'
  };
  
  exportToCSV(testData, testColumns, testOptions);
};
