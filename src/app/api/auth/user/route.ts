import { getUser } from "@/auth/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
