"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

// Type definitions for billing fields
type UserWithBilling = {
  id: string;
  email: string;
  displayName: string | null;
  studyStyle: string;
  dailyStudyTime: number;
  streakCount: number;
  lastActive: Date;
  createAt: Date;
  updatedAt: Date;
  planType: "FREE" | "BASIC" | "PREMIUM";
  billingStatus: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  dailyGenerationsUsed: number;
  lastGenerationReset: Date;
  planEndDate: Date | null;
  planStartDate: Date | null;
  billingEmail: string | null;
};

type BillingRequest = {
  id: string;
  userId: string;
  planType: "FREE" | "BASIC" | "PREMIUM";
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  adminNotes?: string;
  createAt: Date;
  updatedAt: Date;
};

export async function createBillingRequest(
  userId: string,
  planType: "FREE" | "BASIC" | "PREMIUM",
  email: string
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const billingRequest = await (prisma as any).billingRequest.create({
      data: {
        userId,
        planType,
        email,
        status: "PENDING",
      },
    }) as BillingRequest;

    revalidatePath("/");
    return billingRequest;
  } catch (error) {
    throw new Error("Failed to create billing request");
  }
}

export async function getBillingRequests() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests = await (prisma as any).billingRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createAt: "desc",
      },
    });

    return requests;
  } catch (error) {
    throw new Error("Failed to fetch billing requests");
  }
}

export async function updateBillingRequestStatus(
  requestId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED",
  adminNotes?: string
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = await (prisma as any).billingRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNotes,
        updatedAt: new Date(),
      },
    });

    // If approved, update user's plan
    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: {
          planType: request.planType,
          billingEmail: request.email,
          billingStatus: "ACTIVE",
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          dailyGenerationsUsed: 0,
          lastGenerationReset: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    }

    revalidatePath("/admin");
    return request;
  } catch (error) {
    throw new Error("Failed to update billing request");
  }
}

export async function checkUserUsageLimit(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as UserWithBilling | null;

    if (!user) {
      throw new Error("User not found");
    }

    // Reset daily count if it's a new day
    const now = new Date();
    const lastReset = new Date(user.lastGenerationReset);
    const isNewDay = now.getDate() !== lastReset.getDate() || 
                     now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyGenerationsUsed: 0,
          lastGenerationReset: now,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      return { canGenerate: true, remaining: getPlanLimit(user.planType) };
    }

    const limit = getPlanLimit(user.planType);
    const remaining = limit - user.dailyGenerationsUsed;

    return {
      canGenerate: remaining > 0,
      remaining: Math.max(0, remaining),
      limit,
    };
  } catch (error) {
    console.error("Error checking usage limit:", error);
    throw new Error("Failed to check usage limit");
  }
}

export async function incrementUsage(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
              
              data: {
          dailyGenerationsUsed: {
            increment: 1,
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
    });
    
    revalidatePath("/");
  } catch (error) {
    console.error("Error incrementing usage:", error);
    // Don't throw error to avoid breaking the app
  }
}

export async function getUserBillingInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as UserWithBilling | null;

    if (!user) {
      throw new Error("User not found");
    }

    const limit = getPlanLimit(user.planType);
    const remaining = limit - user.dailyGenerationsUsed;

    return {
      planType: user.planType,
      billingStatus: user.billingStatus,
      dailyGenerationsUsed: user.dailyGenerationsUsed,
      remaining: Math.max(0, remaining),
      limit,
      planEndDate: user.planEndDate,
      billingEmail: user.billingEmail,
    };
  } catch (error) {
    console.error("Error fetching user billing info:", error);
    // Return default values instead of throwing error
    return {
      planType: "FREE" as const,
      billingStatus: "PENDING" as const,
      dailyGenerationsUsed: 0,
      remaining: 10,
      limit: 10,
      planEndDate: null,
      billingEmail: null,
    };
  }
}

function getPlanLimit(planType: "FREE" | "BASIC" | "PREMIUM"): number {
  switch (planType) {
    case "FREE":
      return 10;
    case "BASIC":
      return 100;
    case "PREMIUM":
      return Infinity;
    default:
      return 10;
  }
}

export async function getPlanPrice(planType: "FREE" | "BASIC" | "PREMIUM"): Promise<string> {
  switch (planType) {
    case "FREE":
      return "$0";
    case "BASIC":
      return "$1";
    case "PREMIUM":
      return "$5";
    default:
      return "$0";
  }
}

export async function grantBonusGenerations(userId: string, bonusAmount: number = 2) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as UserWithBilling | null;

    if (!user) {
      throw new Error("User not found");
    }

    // Reset daily count if it's a new day first
    const now = new Date();
    const lastReset = new Date(user.lastGenerationReset);
    const isNewDay = now.getDate() !== lastReset.getDate() || 
                     now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear();

    let currentUsed = user.dailyGenerationsUsed;
    let resetDate = user.lastGenerationReset;

    if (isNewDay) {
      currentUsed = 0;
      resetDate = now;
    }

    // Grant bonus by reducing daily used count (effectively increasing remaining)
    const newUsedCount = Math.max(0, currentUsed - bonusAmount);

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyGenerationsUsed: newUsedCount,
        lastGenerationReset: resetDate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    revalidatePath("/");
    
    const limit = getPlanLimit(user.planType);
    const newRemaining = limit - newUsedCount;
    
    return {
      success: true,
      newRemaining: Math.max(0, newRemaining),
      bonusGranted: bonusAmount
    };
  } catch (error) {
    console.error("Error granting bonus generations:", error);
    throw new Error("Failed to grant bonus generations");
  }
}