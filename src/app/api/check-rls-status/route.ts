import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check RLS status on tables
    const noteRlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'Note'
    `;
    
    const subjectRlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'Subject'
    `;
    
    const userRlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'User'
    `;

    // Check existing policies
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename IN ('Note', 'Subject', 'User')
    `;

    return NextResponse.json({
      noteRlsStatus,
      subjectRlsStatus,
      userRlsStatus,
      policies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Check RLS status error:", error);
    return NextResponse.json(
      { error: "Failed to check RLS status", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 