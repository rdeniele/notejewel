import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST(request: NextRequest) {
  try {
    // Disable RLS on Note table temporarily
    await prisma.$executeRaw`ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;`;
    
    // Disable RLS on Subject table temporarily  
    await prisma.$executeRaw`ALTER TABLE "Subject" DISABLE ROW LEVEL SECURITY;`;
    
    // Disable RLS on User table temporarily
    await prisma.$executeRaw`ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;`;

    return NextResponse.json({ 
      success: true,
      message: "RLS disabled on Note, Subject, and User tables"
    });
  } catch (error) {
    console.error("Fix RLS error:", error);
    return NextResponse.json(
      { error: "Failed to fix RLS policies", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 