import { NextRequest, NextResponse } from 'next/server';
import { 
  getStateTargets, 
  getStates,
  getOrCreateStateTarget,
  initializeTargetsForFiscalYear,
  updateTargetAmount,
  getTargetVsActualComparison,
  getStatesNeedingAttention,
  resetTargetsToPreviousYear,
  getPreviousYearFunding
} from '@/lib/target-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fiscalYear = searchParams.get('fiscalYear');
    const stateCode = searchParams.get('stateCode');

    switch (action) {
      case 'comparison':
        if (!fiscalYear) {
          return NextResponse.json({ error: 'fiscalYear is required' }, { status: 400 });
        }
        const comparison = await getTargetVsActualComparison(fiscalYear);
        return NextResponse.json({ comparison });

      case 'attention':
        if (!fiscalYear) {
          return NextResponse.json({ error: 'fiscalYear is required' }, { status: 400 });
        }
        const threshold = parseFloat(searchParams.get('threshold') || '50');
        const statesNeedingAttention = await getStatesNeedingAttention(fiscalYear, threshold);
        return NextResponse.json({ states: statesNeedingAttention });

      case 'previous-year-funding':
        if (!stateCode || !fiscalYear) {
          return NextResponse.json({ error: 'stateCode and fiscalYear are required' }, { status: 400 });
        }
        const previousFunding = await getPreviousYearFunding(stateCode, fiscalYear);
        return NextResponse.json({ previousYearFunding: previousFunding });

      case 'fiscal-year':
        if (!fiscalYear) {
          return NextResponse.json({ error: 'fiscalYear is required' }, { status: 400 });
        }
        const targets = await getStateTargets();
        const fiscalYearTargets = targets.filter(t => t.fiscalYear === fiscalYear);
        return NextResponse.json({ targets: fiscalYearTargets });

      default:
        const allTargets = await getStateTargets();
        return NextResponse.json({ targets: allTargets });
    }
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch targets data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'initialize':
        const { fiscalYear, forceUpdate } = body;
        if (!fiscalYear) {
          return NextResponse.json({ error: 'fiscalYear is required' }, { status: 400 });
        }
        
        const states = await getStates();
        const stateCodes = states.map(s => s.code);
        const initializedTargets = await initializeTargetsForFiscalYear(
          fiscalYear, 
          stateCodes, 
          forceUpdate || false
        );
        
        return NextResponse.json({ 
          message: `Initialized ${initializedTargets.length} targets for fiscal year ${fiscalYear}`,
          targets: initializedTargets 
        });

      case 'reset':
        const { fiscalYear: resetFY } = body;
        if (!resetFY) {
          return NextResponse.json({ error: 'fiscalYear is required' }, { status: 400 });
        }
        
        const allStates = await getStates();
        const allStateCodes = allStates.map(s => s.code);
        const resetTargets = await resetTargetsToPreviousYear(resetFY, allStateCodes);
        
        return NextResponse.json({ 
          message: `Reset ${resetTargets.length} targets to previous year funding for fiscal year ${resetFY}`,
          targets: resetTargets 
        });

      case 'create':
        const { stateCode, fiscalYear: createFY, customAmount } = body;
        if (!stateCode || !createFY) {
          return NextResponse.json({ error: 'stateCode and fiscalYear are required' }, { status: 400 });
        }
        
        const newTarget = await getOrCreateStateTarget(stateCode, createFY, customAmount);
        return NextResponse.json({ target: newTarget });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing targets request:', error);
    return NextResponse.json(
      { error: 'Failed to process targets request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('stateCode');
    const fiscalYear = searchParams.get('fiscalYear');
    const body = await request.json();

    if (!stateCode || !fiscalYear) {
      return NextResponse.json({ error: 'stateCode and fiscalYear are required' }, { status: 400 });
    }

    const { targetAmount } = body;
    if (typeof targetAmount !== 'number') {
      return NextResponse.json({ error: 'targetAmount must be a number' }, { status: 400 });
    }

    const updatedTarget = await updateTargetAmount(stateCode, fiscalYear, targetAmount);
    return NextResponse.json({ target: updatedTarget });
  } catch (error) {
    console.error('Error updating target:', error);
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    );
  }
}