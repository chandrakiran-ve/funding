import { fetchStates, fetchContributions, fetchStateTargets, fetchSchools, getUsers } from "@/lib/sheets";
import { currentIndianFY } from "@/lib/fy";
import { StatesClient } from "@/components/states/states-client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  // Check user access for regional managers
  const { userId } = await auth();
  if (userId) {
    const users = await getUsers();
    const currentUser = users.find(u => u.id === userId);
    
    // If user is a regional manager, redirect to their first assigned state
    if (currentUser?.role === 'regional_manager' && currentUser?.status === 'approved') {
      const assignedStates = currentUser.assignedStates || [];
      if (assignedStates.length > 0) {
        redirect(`/states/${assignedStates[0]}`);
      } else {
        redirect('/unauthorized');
      }
    }
  }

  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const [states, contributions, targets, schools] = sheetId 
    ? await Promise.all([
        fetchStates(sheetId),
        fetchContributions(sheetId),
        fetchStateTargets(sheetId),
        fetchSchools(sheetId)
      ])
    : [[], [], [], []];

  const currentFY = currentIndianFY();
  const currentContributions = contributions.filter(c => c.fiscalYear === currentFY);
  const currentTargets = targets.filter(t => t.fiscalYear === currentFY);

  // Calculate state metrics
  const stateMetrics = states.map(state => {
    const stateContribs = currentContributions.filter(c => c.stateCode === state.code);
    const stateTargets = currentTargets.filter(t => t.stateCode === state.code);
    const stateSchools = schools.filter(s => s.stateCode === state.code);
    
    const secured = stateContribs.reduce((sum, c) => sum + c.amount, 0);
    const target = stateTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    const shortfall = Math.max(target - secured, 0);
    const achievement = target > 0 ? (secured / target) * 100 : 0;
    
    // Funded schools
    const fundedSchoolIds = new Set(stateContribs.filter(c => c.schoolId).map(c => c.schoolId));
    const fundedSchools = stateSchools.filter(s => fundedSchoolIds.has(s.id));
    
    return {
      ...state,
      secured,
      target,
      shortfall,
      achievement,
      totalSchools: stateSchools.length,
      fundedSchools: fundedSchools.length,
      unfundedSchools: stateSchools.length - fundedSchools.length,
      contributions: stateContribs.length,
      status: (achievement >= 80 ? 'on-track' : achievement >= 50 ? 'at-risk' : 'critical') as 'on-track' | 'at-risk' | 'critical'
    };
  }).sort((a, b) => b.achievement - a.achievement);

  const totalStates = states.length;
  const onTrackStates = stateMetrics.filter(s => s.status === 'on-track').length;
  const atRiskStates = stateMetrics.filter(s => s.status === 'at-risk').length;
  const criticalStates = stateMetrics.filter(s => s.status === 'critical').length;
  
  const totalSecured = stateMetrics.reduce((sum, s) => sum + s.secured, 0);
  const totalTarget = stateMetrics.reduce((sum, s) => sum + s.target, 0);
  const totalSchools = schools.length;
  const totalFundedSchools = stateMetrics.reduce((sum, s) => sum + s.fundedSchools, 0);

  return (
    <StatesClient
      stateMetrics={stateMetrics}
      totalStates={totalStates}
      onTrackStates={onTrackStates}
      atRiskStates={atRiskStates}
      criticalStates={criticalStates}
      totalSecured={totalSecured}
      totalTarget={totalTarget}
      totalSchools={totalSchools}
      totalFundedSchools={totalFundedSchools}
      currentFY={currentFY}
    />
  );
}


