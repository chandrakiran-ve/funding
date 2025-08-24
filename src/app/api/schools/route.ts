import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSchools, addSchool, updateSchool } from "@/lib/sheets";

// GET /api/schools - Get all schools
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools = await getSchools();
    return NextResponse.json(schools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

// POST /api/schools - Create a new school
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await addSchool(sheetId, schoolData);
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}

// PUT /api/schools - Update a school
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolData = await request.json();
    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    
    await updateSchool(sheetId, schoolData.id, schoolData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}
