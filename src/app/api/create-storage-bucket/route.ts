import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Create the storage bucket
    const { data: bucket, error } = await supabase.storage.createBucket('storage', {
      public: true,
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: ['application/pdf']
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return NextResponse.json(
        { error: "Failed to create bucket", details: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      bucket: bucket,
      message: "Storage bucket 'storage' created successfully"
    });
  } catch (error) {
    console.error("Create bucket error:", error);
    return NextResponse.json(
      { error: "Failed to create bucket", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 