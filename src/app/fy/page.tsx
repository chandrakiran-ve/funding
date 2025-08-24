import { 
  getStateTargets, 
  getContributions, 
  getStates,
  getProspects 
} from "@/lib/sheets";
import { FYPageClient } from "@/components/fy-page-client";

export default async function FiscalYearPage() {
  // Fetch all data
  const [stateTargets, contributions, states, prospects] = await Promise.all([
    getStateTargets().catch(() => []),
    getContributions().catch(() => []),
    getStates().catch(() => []),
    getProspects().catch(() => [])
  ]);

  return (
    <FYPageClient
      stateTargets={stateTargets}
      contributions={contributions}
      states={states}
      prospects={prospects}
    />
  );
}
