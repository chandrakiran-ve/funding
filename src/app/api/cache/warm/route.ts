import { NextResponse } from "next/server";
import { 
  getFunders, 
  getContributions, 
  getStateTargets, 
  getProspects, 
  getStates, 
  getSchools 
} from "@/lib/sheets";

// GET /api/cache/warm - Warm up the cache with all data
export async function GET() {
  try {
    console.log("🔥 Warming up cache...");
    
    // Warm up all data in parallel
    const startTime = Date.now();
    
    await Promise.all([
      getFunders().catch(e => console.error("Failed to warm funders:", e)),
      getContributions().catch(e => console.error("Failed to warm contributions:", e)),
      getStateTargets().catch(e => console.error("Failed to warm state targets:", e)),
      getProspects().catch(e => console.error("Failed to warm prospects:", e)),
      getStates().catch(e => console.error("Failed to warm states:", e)),
      getSchools().catch(e => console.error("Failed to warm schools:", e))
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cache warmed up in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Cache warmed up successfully",
      duration: `${duration}ms`
    });
    
  } catch (error) {
    console.error("❌ Failed to warm cache:", error);
    return NextResponse.json(
      { error: "Failed to warm cache" }, 
      { status: 500 }
    );
  }
}
