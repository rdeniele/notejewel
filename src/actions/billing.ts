"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

export async function createBillingRequest(
  userId: string,
  planType: "FREE" | "BASIC" | "PREMIUM",
  email: string
) {
  try {
    const billingRequest = await prisma.billingRequest.create({
      data: {
        userId,
        planType,
        email,
        status: "PENDING",
      },
    });

    revalidatePath("/");
    return billingRequest;
  } catch (error) {
    console.error("Error creating billing request:", error);
    throw new Error("Failed to create billing request");
  }
}

export async function getBillingRequests() {
  try {
    const requests = await prisma.billingRequest.findMany({
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
    console.error("Error fetching billing requests:", error);
    throw new Error("Failed to fetch billing requests");
  }
}

export async function updateBillingRequestStatus(
  requestId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED",
  adminNotes?: string
) {
  try {
    const request = await prisma.billingRequest.update({
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
        },
      });
    }

    revalidatePath("/admin");
    return request;
  } catch (error) {
    console.error("Error updating billing request:", error);
    throw new Error("Failed to update billing request");
  }
}

export async function checkUserUsageLimit(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

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
        },
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
      },
    });

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "AI_GENERATION",
      },
    });

    revalidatePath("/");
  } catch (error) {
    console.error("Error incrementing usage:", error);
    throw new Error("Failed to increment usage");
  }
}

export async function getUserBillingInfo(userId: string) {
  try {
    // Try to get user with new billing fields first
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          planType: true,
          billingStatus: true,
          dailyGenerationsUsed: true,
          lastGenerationReset: true,
          planEndDate: true,
          billingEmail: true,
        },
      });

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
    } catch (prismaError) {
      // If Prisma client doesn't have the new fields yet, return default values
      console.warn("Billing fields not available yet, using defaults:", prismaError);
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
  } catch (error) {
    console.error("Error fetching user billing info:", error);
    throw new Error("Failed to fetch billing info");
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