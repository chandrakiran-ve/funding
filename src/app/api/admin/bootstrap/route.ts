import { NextResponse } from "next/server";
import { addUser, getUsers } from "@/lib/sheets";
import { User } from "@/types/user";

// POST /api/admin/bootstrap - Bootstrap admin user (development only)
export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: "Bootstrap only available in development" }, { status: 403 });
    }

    const users = await getUsers();
    const adminEmail = 'chandrakiran@visionempowertrust.org';
    
    // Check if admin already exists
    const existingAdmin = users.find(u => u.email === adminEmail);
    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Admin user already exists", 
        user: existingAdmin 
      });
    }

    // Create admin user
    const adminUser: Omit<User, 'id'> = {
      email: adminEmail,
      firstName: 'Chandrakiran',
      lastName: 'HJ',
      role: 'admin',
      status: 'approved',
      assignedStates: [],
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'bootstrap'
    };

    const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
    await addUser(sheetId, adminUser, 'bootstrap_admin');

    return NextResponse.json({ 
      message: "Admin user bootstrapped successfully",
      user: { ...adminUser, id: 'bootstrap_admin' }
    }, { status: 201 });

  } catch (error) {
    console.error("Error bootstrapping admin:", error);
    return NextResponse.json({ error: "Failed to bootstrap admin" }, { status: 500 });
  }
}
