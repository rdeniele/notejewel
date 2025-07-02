import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST(request: NextRequest) {
  try {
    // Force disable RLS on all tables
    await prisma.$executeRaw`ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Subject" DISABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;`;
    
    // Drop all existing policies
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can create their own notes" ON "Note";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can view their own notes" ON "Note";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can update their own notes" ON "Note";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can delete their own notes" ON "Note";`;
    
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can create their own subjects" ON "Subject";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can view their own subjects" ON "Subject";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can update their own subjects" ON "Subject";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can delete their own subjects" ON "Subject";`;
    
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can view their own data" ON "User";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can update their own data" ON "User";`;

    return NextResponse.json({ 
      success: true,
      message: "RLS forcefully disabled and all policies removed"
    });
  } catch (error) {
    console.error("Force disable RLS error:", error);
    return NextResponse.json(
      { error: "Failed to force disable RLS", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 