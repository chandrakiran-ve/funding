import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUsers, addUser, updateUser } from "@/lib/sheets";
import { User } from "@/types/user";

// GET /api/users - Get all users (admin only)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserData = await getCurrentUserFromSheets(userId);
    if (!currentUserData || currentUserData.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create/register a new user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUsers = await getUsers();
    const existingUser = existingUsers.find(u => u.id === userId);
    
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user with pending status
    const newUser: Omit<User, 'id'> = {
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: 'pending',
      status: 'pending',
      assignedStates: [],
      requestedAt: new Date().toISOString(),
    };

    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    await addUser(sheetId, newUser, userId);

    return NextResponse.json({ ...newUser, id: userId }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PUT /api/users - Update user (admin only for approvals, user for own profile)
export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 PUT /api/users - Starting user update");
    
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ No userId from auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("✅ User authenticated:", userId);

    const body = await request.json();
    console.log("📝 Request body:", body);
    const { targetUserId, role, status, assignedStates } = body;

    // Check if current user is admin for role/status changes
    console.log("🔍 Checking admin status for user:", userId);
    const currentUserData = await getCurrentUserFromSheets(userId);
    console.log("👤 Current user data:", currentUserData);
    const isAdmin = currentUserData?.role === 'admin';
    console.log("🛡️ Is admin:", isAdmin);

    if (!isAdmin && (role || status || assignedStates)) {
      console.log("❌ Access denied - not admin");
      return NextResponse.json({ error: "Forbidden - Admin access required for role/status changes" }, { status: 403 });
    }

    const updates: Partial<User> = {};
    
    if (isAdmin && role) {
      updates.role = role;
      console.log("📝 Setting role:", role);
    }
    if (isAdmin && status) {
      updates.status = status;
      console.log("📝 Setting status:", status);
    }
    if (isAdmin && assignedStates) {
      updates.assignedStates = assignedStates;
      console.log("📝 Setting assignedStates:", assignedStates);
    }
    if (isAdmin && status === 'approved') {
      updates.approvedAt = new Date().toISOString();
      updates.approvedBy = userId;
      console.log("📝 Setting approval metadata");
    }

    console.log("🔄 Final updates object:", updates);
    console.log("🎯 Target user ID:", targetUserId);

    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    console.log("📊 Sheet ID:", sheetId ? "✅ Present" : "❌ Missing");
    
    await updateUser(sheetId, targetUserId, updates);
    console.log("✅ User updated successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("❌ Error stack:", errorStack);
    return NextResponse.json({ 
      error: "Failed to update user", 
      details: errorMessage 
    }, { status: 500 });
  }
}

// Helper function to get current user from sheets
async function getCurrentUserFromSheets(userId: string): Promise<User | null> {
  try {
    const users = await getUsers();
    console.log("🔍 getCurrentUserFromSheets - Looking for userId:", userId);
    console.log("📊 Available users:", users.map(u => ({ id: u.id, email: u.email, role: u.role, status: u.status })));
    
    // First try to find by Clerk user ID
    let user = users.find(u => u.id === userId);
    console.log("👤 Found user by ID:", user);
    
    // If not found by ID, try to find by email (fallback for older records)
    if (!user) {
      // Get current user's email from Clerk
      const { currentUser } = await import("@clerk/nextjs/server");
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;
      
      if (userEmail) {
        user = users.find(u => u.email === userEmail);
        console.log("👤 Found user by email fallback:", user);
      }
    }
    
    return user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
