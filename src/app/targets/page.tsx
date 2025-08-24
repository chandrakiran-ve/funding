import { TargetManagement } from '@/components/targets/target-management';
import { currentIndianFY } from '@/lib/fy';
import { getStates } from '@/lib/sheets';

export default async function TargetsPage() {
  const currentFY = currentIndianFY();
  const states = await getStates();

  return (
    <div className="container mx-auto py-6">
      <TargetManagement 
        currentFY={currentFY}
        states={states}
      />
    </div>
  );
}