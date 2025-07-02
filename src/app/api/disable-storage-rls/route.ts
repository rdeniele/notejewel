import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Disable RLS on storage.objects table
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    });
    
    if (error) {
      console.error('Error disabling RLS:', error);
      return NextResponse.json(
        { error: "Failed to disable RLS", details: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "RLS disabled on storage.objects"
    });
  } catch (error) {
    console.error("Disable RLS error:", error);
    return NextResponse.json(
      { error: "Failed to disable RLS" }, 
      { status: 500 }
    );
  }
} 