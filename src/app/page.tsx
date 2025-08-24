import { currentIndianFY } from "@/lib/fy";
import { fetchContributions, fetchStateTargets, fetchStates, fetchFunders, fetchProspects, getUsers } from "@/lib/sheets";
import { EnhancedOverview } from "@/components/overview/enhanced-overview";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
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
  const [states, contributions, targets, funders, prospects] = sheetId
    ? await Promise.all([
        fetchStates(sheetId),
        fetchContributions(sheetId),
        fetchStateTargets(sheetId),
        fetchFunders(sheetId),
        fetchProspects(sheetId),
      ])
    : [[], [], [], [], []];

  const currentFY = currentIndianFY();

  return (
    <EnhancedOverview 
      data={{
        states,
        contributions,
        targets,
        funders,
        prospects,
        currentFY
      }}
    />
  );
}
