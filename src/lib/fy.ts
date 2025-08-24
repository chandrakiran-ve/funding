export type FiscalYear = `FY${number}-${number}`;

export function currentIndianFY(date = new Date()): FiscalYear {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const start = month >= 3 ? year : year - 1;
  const end = (start + 1) % 100;
  return `FY${String(start).slice(-2)}-${String(end).padStart(2, "0")}` as FiscalYear;
}

export function nextIndianFY(fy: FiscalYear): FiscalYear {
  const [s, e] = fy.replace("FY", "").split("-").map((v) => parseInt(v, 10));
  const ns = (s + 1) % 100;
  const ne = (e + 1) % 100;
  return `FY${String(ns).padStart(2, "0")}-${String(ne).padStart(2, "0")}` as FiscalYear;
}

export function previousIndianFY(fy: FiscalYear): FiscalYear {
  const [s, e] = fy.replace("FY", "").split("-").map((v) => parseInt(v, 10));
  const ps = (s + 99) % 100;
  const pe = (e + 99) % 100;
  return `FY${String(ps).padStart(2, "0")}-${String(pe).padStart(2, "0")}` as FiscalYear;
}

export function fyLabel(startYearTwoDigits: number): FiscalYear {
  const s = startYearTwoDigits % 100;
  const e = (s + 1) % 100;
  return `FY${String(s).padStart(2, "0")}-${String(e).padStart(2, "0")}` as FiscalYear;
}

// Aliases for consistency with new code
export const getCurrentFY = currentIndianFY;
export const getNextFY = () => nextIndianFY(currentIndianFY());
export const getPreviousFY = () => previousIndianFY(currentIndianFY());

// Generate all fiscal years from 2018 to current + 5 years
export function getAllFiscalYears(): FiscalYear[] {
  const fiscalYears: FiscalYear[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = 2018;
  const endYear = currentYear + 5;
  
  for (let year = startYear; year <= endYear; year++) {
    const fyStart = year % 100;
    const fyEnd = (year + 1) % 100;
    const fy = `FY${String(fyStart).padStart(2, "0")}-${String(fyEnd).padStart(2, "0")}` as FiscalYear;
    fiscalYears.push(fy);
  }
  
  return fiscalYears;
}

// Convert fiscal year to full year format for better readability
export function fiscalYearToDisplay(fy: FiscalYear): string {
  const [s, e] = fy.replace("FY", "").split("-").map((v) => parseInt(v, 10));
  const startYear = s < 50 ? 2000 + s : 1900 + s; // Assume years < 50 are 2000s
  const endYear = e < 50 ? 2000 + e : 1900 + e;
  return `${startYear}-${endYear}`;
}

// Get fiscal year from full year
export function yearToFiscalYear(year: number): FiscalYear {
  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;
  return `FY${String(fyStart).padStart(2, "0")}-${String(fyEnd).padStart(2, "0")}` as FiscalYear;
}

// Get all historical years that have data
export function getHistoricalFiscalYears(): FiscalYear[] {
  return [
    'FY18-19', 'FY19-20', 'FY20-21', 'FY21-22', 'FY22-23', 
    'FY23-24', 'FY24-25', 'FY25-26'
  ] as FiscalYear[];
}



