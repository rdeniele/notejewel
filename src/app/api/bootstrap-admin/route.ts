import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

// This endpoint should only be used ONCE to create the first admin
// Remove this file after creating your first admin user
export async function POST(request: NextRequest) {
  try {
    const { email, adminSecret } = await request.json();

    // Add a secret to prevent unauthorized access
    if (adminSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if there are any existing admins
    const existingAdmins = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    if (existingAdmins > 0) {
      return NextResponse.json({ 
        error: "Admin already exists. Use the admin panel to manage users." 
      }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: {
        email,
        role: "ADMIN",
        displayName: "Admin User"
      },
      select: { id: true, email: true, displayName: true, role: true },
    });

    return NextResponse.json({ 
      message: "First admin user created successfully", 
      user,
      warning: "Please delete this endpoint after use for security"
    });
  } catch (error) {
    console.error("Error creating first admin:", error);
    return NextResponse.json({ 
      error: "Failed to create admin user" 
    }, { status: 500 });
  }
}
