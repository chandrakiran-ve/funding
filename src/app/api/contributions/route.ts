import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getContributions, addContribution, updateContribution } from "@/lib/sheets";

// GET /api/contributions - Get all contributions
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contributions = await getContributions();
    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 });
  }
}

// POST /api/contributions - Create a new contribution
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contributionData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await addContribution(sheetId, contributionData);
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating contribution:", error);
    return NextResponse.json({ error: "Failed to create contribution" }, { status: 500 });
  }
}

// PUT /api/contributions - Update a contribution
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contributionData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await updateContribution(sheetId, contributionData.id, contributionData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contribution:", error);
    return NextResponse.json({ error: "Failed to update contribution" }, { status: 500 });
  }
}
