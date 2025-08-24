import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStateTargets, addStateTarget, updateStateTarget } from "@/lib/sheets";

// GET /api/state-targets - Get all state targets
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targets = await getStateTargets();
    return NextResponse.json(targets);
  } catch (error) {
    console.error("Error fetching state targets:", error);
    return NextResponse.json({ error: "Failed to fetch state targets" }, { status: 500 });
  }
}

// POST /api/state-targets - Create a new state target
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await addStateTarget(sheetId, targetData);
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating state target:", error);
    return NextResponse.json({ error: "Failed to create state target" }, { status: 500 });
  }
}

// PUT /api/state-targets - Update a state target
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await updateStateTarget(sheetId, targetData.stateCode, targetData.fiscalYear, targetData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating state target:", error);
    return NextResponse.json({ error: "Failed to update state target" }, { status: 500 });
  }
}
