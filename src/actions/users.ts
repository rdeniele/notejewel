"use server"

import { createClient } from "@/auth/server"
import { prisma } from "@/db/prisma"
import { handleError } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export const loginAction = async (email:string, password:string) => {
    try {
        const {auth} = await createClient()
        const {error} = await auth.signInWithPassword({
            email,
            password
        })
        
        if (error) throw error

        return { errorMessage: null };
    } catch (error) {
        return handleError(error)
        
    }
}

export const logOutAction = async () => {
    try {
        const {auth} = await createClient()
        const {error} = await auth.signOut()
        
        if (error) throw error

        return { errorMessage: null };
    } catch (error) {
        return handleError(error)
        
    }
}

export const signUpAction = async (email:string, password:string) => {
    try {
        const {auth} = await createClient()
        const {data, error} = await auth.signUp({
            email,
            password
        })
        
        if (error) throw error

        const userId = data.user?.id;

        if(!userId) throw new Error("Error signing up");

        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            // add user to database only if they don't exist
            await prisma.user.create({
                data: {
                    id: userId,
                    email: email,
                    studyStyle: "READING",
                    dailyStudyTime: 60,
                    streakCount: 0,
                    lastActive: new Date(),
                }
            });
        }

        return { errorMessage: null };
    } catch (error) {
        return handleError(error)
        
    }
}

export async function migrateUserToNewSchema(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has the new fields
    if (user.studyStyle && user.dailyStudyTime !== undefined) {
      return user; // Already migrated
    }

    // Update user with default values for new schema
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        studyStyle: "READING", // Default study style
        dailyStudyTime: 60, // Default 60 minutes
        streakCount: 0, // Start with 0 streak
        lastActive: new Date(),
        displayName: user.displayName || null,
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error("Failed to migrate user to new schema");
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    studyStyle?: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
    dailyStudyTime?: number;
    displayName?: string;
  }
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        studyStyle: data.studyStyle,
        dailyStudyTime: data.dailyStudyTime,
        displayName: data.displayName,
        lastActive: new Date(),
      },
    });

    revalidatePath("/");
    return updatedUser;
  } catch (error) {
    throw new Error("Failed to update user profile");
  }
}

export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subjects: true,
        notes: {
          include: {
            subject: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        studyLogs: {
          orderBy: {
            timestamp: "desc",
          },
          take: 10,
        },
      },
    });

    return user;
  } catch (error) {
    throw new Error("Failed to fetch user profile");
  }
}

export async function updateUserStreak(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error("User not found for streak update:", userId);
      return null; // Don't throw error, just return null
    }

    const today = new Date();
    const lastActive = user.lastActive;
    const daysSinceLastActive = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreakCount = user.streakCount || 0;

    // If more than 7 days have passed, reset streak to 0
    if (daysSinceLastActive >= 7) {
      newStreakCount = 0;
    } else if (daysSinceLastActive === 1) {
      // Consecutive day - add 1 to streak
      newStreakCount += 1;
    } else if (daysSinceLastActive > 1 && daysSinceLastActive < 7) {
      // Streak broken but less than 7 days - reset to 1
      newStreakCount = 1;
    } else if (daysSinceLastActive === 0) {
      // Same day, don't increment
      newStreakCount = user.streakCount || 0;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        streakCount: newStreakCount,
        lastActive: today,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user streak:", error);
    // Don't throw error to avoid breaking the app
    return null;
  }
}