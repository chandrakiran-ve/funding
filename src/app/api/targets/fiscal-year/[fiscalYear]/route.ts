import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { fiscalYear: string } }
) {
  try {
    const { fiscalYear } = params;
    
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/v1/targets/fiscal-year/${fiscalYear}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching targets for fiscal year:', error);
    return NextResponse.json(
      { error: 'Failed to fetch targets for fiscal year' },
      { status: 500 }
    );
  }
}