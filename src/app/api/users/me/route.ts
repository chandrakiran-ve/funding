import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUsers, addUser } from "@/lib/sheets";
import { User } from "@/types/user";

// GET /api/users/me - Get current user status
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user exists in our system
    const users = await getUsers();
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || '';
    
    // First try to find by Clerk user ID, then by email
    let user = users.find(u => u.id === userId) || users.find(u => u.email === userEmail);

    // If user doesn't exist, create them
    if (!user) {
      // Check if this is a pre-approved admin email
      const isPreApprovedAdmin = userEmail === 'chandrakiran@visionempowertrust.org' || 
                                userEmail === 'admin@visionempowertrust.org';
      
      const newUser: Omit<User, 'id'> = {
        email: userEmail,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: isPreApprovedAdmin ? 'admin' : 'pending',
        status: isPreApprovedAdmin ? 'approved' : 'pending',
        assignedStates: [],
        requestedAt: new Date().toISOString(),
        ...(isPreApprovedAdmin && {
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        })
      };

      const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
      await addUser(sheetId, newUser, userId);
      
      user = { ...newUser, id: userId };
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
