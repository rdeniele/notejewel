import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // 2. Check if storage bucket exists
    const storageBucket = buckets?.find(b => b.name === 'storage');
    
    // 3. Try to list files in storage bucket (if it exists)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filesInStorage: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filesError: any = null;
    if (storageBucket) {
      const { data: files, error } = await supabase.storage.from('storage').list();
      filesInStorage = files;
      filesError = error;
    }

    return NextResponse.json({
      buckets: buckets || [],
      bucketsError: bucketsError?.message,
      storageBucketExists: !!storageBucket,
      storageBucket: storageBucket,
      filesInStorage,
      filesError: filesError?.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Debug storage error:", error);
    return NextResponse.json(
      { error: "Failed to debug storage", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 