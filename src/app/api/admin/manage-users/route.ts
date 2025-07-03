import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/auth/server";

export async function POST(request: NextRequest) {
  try {
    // Only existing admins can create new admins
    await requireAdmin();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, displayName: true, role: true },
    });

    return NextResponse.json({ 
      message: "User promoted to admin successfully", 
      user 
    });
  } catch (error: unknown) {
    console.error("Error promoting user to admin:", error);
    
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: "Failed to promote user to admin" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only existing admins can remove admin status
    await requireAdmin();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: "USER" },
      select: { id: true, email: true, displayName: true, role: true },
    });

    return NextResponse.json({ 
      message: "Admin privileges removed successfully", 
      user 
    });
  } catch (error: unknown) {
    console.error("Error removing admin privileges:", error);
    
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: "Failed to remove admin privileges" 
    }, { status: 500 });
  }
}
