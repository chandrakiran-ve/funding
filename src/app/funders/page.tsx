import { fetchFunders, fetchContributions } from "@/lib/sheets";
import { currentIndianFY } from "@/lib/fy";
import { FundersClient } from "@/components/funders/funders-client";

export default async function Page() {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const [funders, contributions] = sheetId 
    ? await Promise.all([
        fetchFunders(sheetId),
        fetchContributions(sheetId)
      ])
    : [[], []];

  const currentFY = currentIndianFY();
  const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);

  // Calculate funder metrics
  const funderMetrics = funders.map(funder => {
    const funderContribs = currentContributions.filter(c => c.funderId === funder.id);
    const totalAmount = funderContribs.reduce((sum, c) => sum + c.amount, 0);
    const stateCount = new Set(funderContribs.map(c => c.stateCode)).size;
    const contributionCount = funderContribs.length;
    
    // Historical data (all years)
    const allFunderContribs = contributions.filter(c => c.funderId === funder.id);
    const historicalAmount = allFunderContribs.reduce((sum, c) => sum + c.amount, 0);
    const fiscalYears = new Set(allFunderContribs.map(c => c.fiscalYear)).size;
    
    return {
      ...funder,
      currentAmount: totalAmount,
      historicalAmount,
      stateCount,
      contributionCount,
      fiscalYears,
      status: totalAmount > 0 ? 'active' : 'inactive'
    };
  }).sort((a, b) => b.currentAmount - a.currentAmount);

  const activeFunders = funderMetrics.filter(f => f.status === 'active').length;
  const totalCurrentFunding = funderMetrics.reduce((sum, f) => sum + f.currentAmount, 0);
  const totalHistoricalFunding = funderMetrics.reduce((sum, f) => sum + f.historicalAmount, 0);

  return (
    <FundersClient
      funderMetrics={funderMetrics}
      activeFunders={activeFunders}
      totalCurrentFunding={totalCurrentFunding}
      totalHistoricalFunding={totalHistoricalFunding}
      currentFY={currentFY}
    />
  );
}


