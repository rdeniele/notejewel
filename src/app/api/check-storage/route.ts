import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return NextResponse.json(
        { error: "Failed to list buckets", details: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      buckets: buckets || [],
      count: buckets?.length || 0
    });
  } catch (error) {
    console.error("Storage check error:", error);
    return NextResponse.json(
      { error: "Failed to check storage" }, 
      { status: 500 }
    );
  }
} 