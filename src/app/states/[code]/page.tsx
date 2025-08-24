import { fetchContributions, fetchStateTargets, fetchStates, fetchSchools, fetchFunders, getUsers } from "@/lib/sheets";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StatePageClient } from "@/components/state-page-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  // Await params as required in Next.js 15
  const { code } = await params;
  
  // Check user access for regional managers
  const { userId } = await auth();
  if (userId) {
    const users = await getUsers();
    const currentUser = users.find(u => u.id === userId);
    
    // If user is a regional manager, check if they have access to this state
    if (currentUser?.role === 'regional_manager' && currentUser?.status === 'approved') {
      const assignedStates = currentUser.assignedStates || [];
      if (!assignedStates.includes(code)) {
        // Redirect to first assigned state or unauthorized page
        if (assignedStates.length > 0) {
          redirect(`/states/${assignedStates[0]}`);
        } else {
          redirect('/unauthorized');
        }
      }
    }
  }

  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const [states, contributions, targets, schools, funders] = sheetId
    ? await Promise.all([
        fetchStates(sheetId),
        fetchContributions(sheetId),
        fetchStateTargets(sheetId),
        fetchSchools(sheetId),
        fetchFunders(sheetId)
      ])
    : [[], [], [], [], []];
  
  const state = states.find((s) => s.code === code);
  
  if (!state) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium">State not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The state you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link href="/states">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to States
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StatePageClient
      stateCode={code}
      state={state}
      contributions={contributions}
      targets={targets}
      schools={schools}
      funders={funders}
    />
  );
}