import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getProspects, 
  addProspect,
  updateProspect,
  deleteProspect
} from "@/lib/sheets";

// GET - Fetch all prospects
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prospects = await getProspects();
    return NextResponse.json(prospects);
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 }
    );
  }
}

// POST - Create new prospect
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    if (!sheetId) {
      return NextResponse.json({ error: "Sheet ID not configured" }, { status: 500 });
    }

    // Generate ID if not provided
    const prospectData = {
      id: data.id || `prospect-${Date.now()}`,
      stateCode: data.stateCode || "",
      funderName: data.funderName || "",
      stage: data.stage || "Lead",
      estimatedAmount: data.estimatedAmount || 0,
      probability: data.probability || 0,
      nextAction: data.nextAction || "",
      dueDate: data.dueDate || "",
      owner: data.owner || "",
      description: data.description || "",
      documents: data.documents || "",
      tags: data.tags || "",
      contactPerson: data.contactPerson || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      lastContact: data.lastContact || "",
      notes: data.notes || ""
    };

    await addProspect(sheetId, prospectData);
    return NextResponse.json({ success: true, prospect: prospectData });
  } catch (error) {
    console.error("Error creating prospect:", error);
    return NextResponse.json(
      { error: "Failed to create prospect" },
      { status: 500 }
    );
  }
}

// PUT - Update existing prospect
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updates } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Prospect ID is required" }, { status: 400 });
    }

    const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    if (!sheetId) {
      return NextResponse.json({ error: "Sheet ID not configured" }, { status: 500 });
    }

    await updateProspect(sheetId, id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating prospect:", error);
    return NextResponse.json(
      { error: "Failed to update prospect" },
      { status: 500 }
    );
  }
}

// DELETE - Delete prospect
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Prospect ID is required" }, { status: 400 });
    }

    const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    if (!sheetId) {
      return NextResponse.json({ error: "Sheet ID not configured" }, { status: 500 });
    }

    await deleteProspect(sheetId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prospect:", error);
    return NextResponse.json(
      { error: "Failed to delete prospect" },
      { status: 500 }
    );
  }
}
