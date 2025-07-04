import { getUserBillingInfo } from "@/actions/billing";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const billingInfo = await getUserBillingInfo(userId);
    
    return NextResponse.json(billingInfo, { status: 200 });
  } catch (error) {
    console.error('Error getting user billing info:', error);
    return NextResponse.json(
      { 
        planType: "FREE",
        billingStatus: "PENDING",
        dailyGenerationsUsed: 0,
        remaining: 5,
        limit: 5,
        planEndDate: null,
        billingEmail: null,
      }, 
      { status: 200 }
    );
  }
}
