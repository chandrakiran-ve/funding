import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStates } from "@/lib/sheets";
import { addState, updateState } from "@/lib/funder-crud";

// GET /api/states - Get all states
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const states = await getStates();
    return NextResponse.json(states);
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
  }
}

// POST /api/states - Create a new state (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin
    
    const body = await request.json();
    const { code, name, coordinator } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
    }

    const newState = {
      name,
      coordinator: coordinator || ''
    };

    const result = await addState(newState);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating state:", error);
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
  }
}

// PUT /api/states - Update a state (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin
    
    const body = await request.json();
    const { code, ...updates } = body;

    if (!code) {
      return NextResponse.json({ error: "State code is required" }, { status: 400 });
    }

    await updateState(code, updates);
    return NextResponse.json({ message: "State updated successfully" });
  } catch (error) {
    console.error("Error updating state:", error);
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 });
  }
}

// DELETE /api/states - Delete a state (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin
    
    return NextResponse.json({ message: "State deletion not yet implemented" }, { status: 501 });
  } catch (error) {
    console.error("Error deleting state:", error);
    return NextResponse.json({ error: "Failed to delete state" }, { status: 500 });
  }
}
