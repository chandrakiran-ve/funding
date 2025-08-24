import { StateTarget, Contribution, getStateTargets, getContributions, addStateTarget, updateStateTarget, getStates } from './sheets';
import { previousIndianFY, type FiscalYear } from './fy';

// Re-export functions that the API needs
export { getStateTargets, getStates } from './sheets';

/**
 * Calculate total contributions for a state in a specific fiscal year
 */
export function calculateStateTotal(
  contributions: Contribution[], 
  stateCode: string, 
  fiscalYear: string
): number {
  return contributions
    .filter(c => c.stateCode === stateCode && c.fiscalYear === fiscalYear)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
}

/**
 * Get previous fiscal year string
 */
export function getPreviousFiscalYear(fiscalYear: string): string {
  // Use the proper fiscal year utility if it's in the correct format
  if (fiscalYear.startsWith('FY') && fiscalYear.includes('-')) {
    return previousIndianFY(fiscalYear as FiscalYear);
  }
  
  // Fallback for other formats
  if (fiscalYear.startsWith('FY')) {
    // Format: FY2024
    const year = parseInt(fiscalYear.substring(2));
    return `FY${year - 1}`;
  } else {
    // Format: 2024
    const year = parseInt(fiscalYear);
    return (year - 1).toString();
  }
}

/**
 * Get or create target for a state, defaulting to previous year's funding
 */
export async function getOrCreateStateTarget(
  stateCode: string,
  fiscalYear: string,
  customAmount?: number
): Promise<StateTarget> {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured");
  }

  // Get existing targets
  const existingTargets = await getStateTargets();
  const existingTarget = existingTargets.find(
    t => t.stateCode === stateCode && t.fiscalYear === fiscalYear
  );

  // If target exists, return it
  if (existingTarget) {
    return existingTarget;
  }

  // Calculate target amount
  let targetAmount = customAmount;
  
  if (targetAmount === undefined) {
    // Use previous year's funding as default
    const contributions = await getContributions();
    const previousFY = getPreviousFiscalYear(fiscalYear);
    targetAmount = calculateStateTotal(contributions, stateCode, previousFY);
  }

  // Create new target
  const newTarget: StateTarget = {
    stateCode,
    fiscalYear,
    targetAmount: targetAmount || 0
  };

  await addStateTarget(sheetId, newTarget);
  return newTarget;
}

/**
 * Initialize targets for all states in a fiscal year using previous year funding
 */
export async function initializeTargetsForFiscalYear(
  fiscalYear: string,
  stateCodes: string[],
  forceUpdate: boolean = false
): Promise<StateTarget[]> {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured");
  }

  const existingTargets = await getStateTargets();
  const contributions = await getContributions();
  const previousFY = getPreviousFiscalYear(fiscalYear);
  
  const results: StateTarget[] = [];

  for (const stateCode of stateCodes) {
    const existingTarget = existingTargets.find(
      t => t.stateCode === stateCode && t.fiscalYear === fiscalYear
    );

    if (existingTarget && !forceUpdate) {
      results.push(existingTarget);
      continue;
    }

    // Calculate previous year funding
    const previousYearFunding = calculateStateTotal(contributions, stateCode, previousFY);

    if (existingTarget && forceUpdate) {
      // Update existing target
      await updateStateTarget(sheetId, stateCode, fiscalYear, {
        targetAmount: previousYearFunding
      });
      results.push({
        ...existingTarget,
        targetAmount: previousYearFunding
      });
    } else {
      // Create new target
      const newTarget: StateTarget = {
        stateCode,
        fiscalYear,
        targetAmount: previousYearFunding
      };
      await addStateTarget(sheetId, newTarget);
      results.push(newTarget);
    }
  }

  return results;
}

/**
 * Update target amount for a specific state and fiscal year
 */
export async function updateTargetAmount(
  stateCode: string,
  fiscalYear: string,
  newAmount: number
): Promise<StateTarget> {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured");
  }

  // Check if target exists
  const existingTargets = await getStateTargets();
  const existingTarget = existingTargets.find(
    t => t.stateCode === stateCode && t.fiscalYear === fiscalYear
  );

  if (existingTarget) {
    // Update existing target
    await updateStateTarget(sheetId, stateCode, fiscalYear, {
      targetAmount: newAmount
    });
    return {
      ...existingTarget,
      targetAmount: newAmount
    };
  } else {
    // Create new target with custom amount
    const newTarget: StateTarget = {
      stateCode,
      fiscalYear,
      targetAmount: newAmount
    };
    await addStateTarget(sheetId, newTarget);
    return newTarget;
  }
}

/**
 * Get target vs actual comparison for all states in a fiscal year
 */
export async function getTargetVsActualComparison(fiscalYear: string): Promise<{
  stateCode: string;
  targetAmount: number;
  actualAmount: number;
  difference: number;
  percentageAchieved: number;
  status: 'exceeded' | 'on_track' | 'behind';
  previousYearFunding: number;
}[]> {
  const targets = await getStateTargets();
  const contributions = await getContributions();
  const previousFY = getPreviousFiscalYear(fiscalYear);

  const fiscalYearTargets = targets.filter(t => t.fiscalYear === fiscalYear);
  
  return fiscalYearTargets.map(target => {
    const actualAmount = calculateStateTotal(contributions, target.stateCode, fiscalYear);
    const previousYearFunding = calculateStateTotal(contributions, target.stateCode, previousFY);
    const difference = actualAmount - target.targetAmount;
    const percentageAchieved = target.targetAmount > 0 ? (actualAmount / target.targetAmount) * 100 : 0;
    
    let status: 'exceeded' | 'on_track' | 'behind';
    if (percentageAchieved >= 100) {
      status = 'exceeded';
    } else if (percentageAchieved >= 80) {
      status = 'on_track';
    } else {
      status = 'behind';
    }

    return {
      stateCode: target.stateCode,
      targetAmount: target.targetAmount,
      actualAmount,
      difference,
      percentageAchieved: Math.round(percentageAchieved * 100) / 100,
      status,
      previousYearFunding
    };
  });
}

/**
 * Get states that need attention (significantly behind targets)
 */
export async function getStatesNeedingAttention(
  fiscalYear: string,
  thresholdPercentage: number = 50
): Promise<{
  stateCode: string;
  targetAmount: number;
  actualAmount: number;
  percentageAchieved: number;
  shortfall: number;
}[]> {
  const comparison = await getTargetVsActualComparison(fiscalYear);
  
  return comparison
    .filter(item => item.percentageAchieved < thresholdPercentage)
    .map(item => ({
      stateCode: item.stateCode,
      targetAmount: item.targetAmount,
      actualAmount: item.actualAmount,
      percentageAchieved: item.percentageAchieved,
      shortfall: item.targetAmount - item.actualAmount
    }))
    .sort((a, b) => a.percentageAchieved - b.percentageAchieved);
}

/**
 * Reset all targets for a fiscal year to previous year funding amounts
 */
export async function resetTargetsToPreviousYear(
  fiscalYear: string,
  stateCodes: string[]
): Promise<StateTarget[]> {
  return initializeTargetsForFiscalYear(fiscalYear, stateCodes, true);
}

/**
 * Get previous year funding for a specific state
 */
export async function getPreviousYearFunding(
  stateCode: string,
  fiscalYear: string
): Promise<number> {
  const contributions = await getContributions();
  const previousFY = getPreviousFiscalYear(fiscalYear);
  return calculateStateTotal(contributions, stateCode, previousFY);
}