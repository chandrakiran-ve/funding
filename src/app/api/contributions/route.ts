import { NextRequest, NextResponse } from 'next/server';
import { getContributions } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  try {
    const contributions = await getContributions();
    return NextResponse.json({ contributions });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions data' },
      { status: 500 }
    );
  }
}