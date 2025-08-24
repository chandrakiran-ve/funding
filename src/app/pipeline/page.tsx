import { getProspects, getStates } from "@/lib/sheets";
import { PipelineClient } from "@/components/pipeline/pipeline-client";

export default async function PipelinePage() {
  // Fetch all data server-side
  const [prospects, states] = await Promise.all([
    getProspects().catch(() => []),
    getStates().catch(() => [])
  ]);

  return (
    <PipelineClient 
      initialProspects={prospects}
      states={states}
    />
  );
}