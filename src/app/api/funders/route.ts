import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFunders } from '@/lib/sheets';
import { addFunder, updateFunder } from '@/lib/funder-crud';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const funders = await getFunders();
    return NextResponse.json(funders);
  } catch (error) {
    console.error('Error fetching funders:', error);
    return NextResponse.json({ error: 'Failed to fetch funders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, type, priority, owner, contactPerson, contactEmail, contactPhone, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newFunder = {
      name,
      type: type || 'Corporate',
      priority: priority || 'Medium',
      owner: owner || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      description: description || ''
    };

    const result = await addFunder(newFunder);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding funder:', error);
    return NextResponse.json({ error: 'Failed to add funder' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Funder ID is required' }, { status: 400 });
    }

    const result = await updateFunder(id, updates);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating funder:', error);
    return NextResponse.json({ error: 'Failed to update funder' }, { status: 500 });
  }
}
