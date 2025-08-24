import { NextResponse } from "next/server";
import { getStates } from "@/lib/sheets";

// GET /api/test-states - Test states fetching
export async function GET() {
  try {
    console.log("🧪 Testing states fetch...");
    const states = await getStates();
    console.log("📊 States result:", states);
    
    return NextResponse.json({
      success: true,
      count: states.length,
      states: states,
      sample: states.slice(0, 3) // Show first 3 for debugging
    });
  } catch (error) {
    console.error("❌ Test states error:", error);
    return NextResponse.json(
      { error: "Failed to fetch states", details: error.message }, 
      { status: 500 }
    );
  }
}
