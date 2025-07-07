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
      remaining: 5,
      limit: 5,
      planEndDate: null,
      billingEmail: null,
    };
  }
}

function getPlanLimit(planType: "FREE" | "BASIC" | "PREMIUM"): number {
  switch (planType) {
    case "FREE":
      return 50; // Increased from 5 to 50 for flashcards, quiz, and summarize
    case "BASIC":
      return 100;
    case "PREMIUM":
      return Infinity;
    default:
      return 50;
  }
}

export async function getPlanPrice(planType: "FREE" | "BASIC" | "PREMIUM"): Promise<string> {
  switch (planType) {
    case "FREE":
      return "$0";
    case "BASIC":
      return "$1";
    case "PREMIUM":
      return "$4.99";
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

// Admin-only functions for plan management
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        planType: true,
        billingStatus: true,
        planStartDate: true,
        planEndDate: true,
        dailyGenerationsUsed: true,
        lastGenerationReset: true,
        createAt: true,
        role: true,
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function updateUserPlan(
  userId: string, 
  planType: "FREE" | "BASIC" | "PREMIUM",
  durationMonths: number = 1
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const planEndDate = new Date(now);
    planEndDate.setMonth(planEndDate.getMonth() + durationMonths);

    const billingStatus = planType === "FREE" ? "PENDING" : "ACTIVE";

    await prisma.user.update({
      where: { id: userId },
      data: {
        planType,
        billingStatus,
        planStartDate: now,
        planEndDate: planType === "FREE" ? null : planEndDate,
        // Reset usage when changing plans
        dailyGenerationsUsed: 0,
        lastGenerationReset: now,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // Log the admin action
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: `ADMIN_PLAN_CHANGE_${planType}`,
      },
    });

    revalidatePath("/admin");
    
    return {
      success: true,
      message: `User plan updated to ${planType} successfully`,
    };
  } catch (error) {
    console.error("Error updating user plan:", error);
    throw new Error("Failed to update user plan");
  }
}

export async function resetUserUsage(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyGenerationsUsed: 0,
        lastGenerationReset: now,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // Log the admin action
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "ADMIN_USAGE_RESET",
      },
    });

    revalidatePath("/admin");
    
    return {
      success: true,
      message: "User usage reset successfully",
    };
  } catch (error) {
    console.error("Error resetting user usage:", error);
    throw new Error("Failed to reset user usage");
  }
}

export async function extendUserPlan(userId: string, additionalMonths: number = 1) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.planType === "FREE") {
      throw new Error("Cannot extend free plan. Upgrade to a paid plan first.");
    }

    const currentEndDate = user.planEndDate || new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    await prisma.user.update({
      where: { id: userId },
      data: {
        planEndDate: newEndDate,
        billingStatus: "ACTIVE", // Ensure status is active when extending
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // Log the admin action
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: `ADMIN_PLAN_EXTENSION_${additionalMonths}M`,
      },
    });

    revalidatePath("/admin");
    
    return {
      success: true,
      message: `User plan extended by ${additionalMonths} months successfully`,
    };
  } catch (error) {
    console.error("Error extending user plan:", error);
    throw new Error("Failed to extend user plan");
  }
}