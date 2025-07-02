import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";
import { getUser } from "@/auth/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // 1. List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // 2. Try to list files in storage bucket
    let filesInStorage: unknown = null;
    let filesError: unknown = null;
    if (buckets?.some(b => b.name === 'storage')) {
      const { data: files, error } = await supabase.storage.from('storage').list();
      filesInStorage = files;
      filesError = error;
    }

    // 3. Test upload permissions with a small test file
    let uploadTest: unknown = null;
    let uploadError: unknown = null;
    try {
      const testBuffer = Buffer.from('test file content');
      const testPath = `${user.id}/test-${Date.now()}.txt`;
      
      const { data: uploadData, error } = await supabase.storage
        .from('storage')
        .upload(testPath, testBuffer, {
          contentType: 'text/plain',
          upsert: false
        });
      
      uploadTest = uploadData;
      uploadError = error;
      
      // If upload succeeded, try to delete the test file
      if (!error) {
        await supabase.storage.from('storage').remove([testPath]);
      }
    } catch (e) {
      uploadError = e;
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      buckets: buckets || [],
      bucketsError: bucketsError?.message,
      storageBucketExists: buckets?.some(b => b.name === 'storage'),
      filesInStorage,
      filesError: (filesError as Error | null)?.message || filesError,
      uploadTest,
      uploadError: (uploadError as Error | null)?.message || String(uploadError),
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