"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

export async function createSubject(
  userId: string,
  data: {
    name: string;
    examDate: Date | null;
    quizFrequency: number;
  }
) {
  try {
    const subject = await prisma.subject.create({
      data: {
        userId,
        name: data.name,
        examDate: data.examDate,
        quizFrequency: data.quizFrequency,
      },
    });

    revalidatePath("/");
    return subject;
  } catch (error) {
    console.error("Error creating subject:", error);
    throw new Error("Failed to create subject");
  }
}

export async function updateSubject(
  subjectId: string,
  data: {
    name: string;
    examDate: Date | null;
    quizFrequency: number;
  }
) {
  try {
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: data.name,
        examDate: data.examDate,
        quizFrequency: data.quizFrequency,
      },
    });

    revalidatePath("/");
    return subject;
  } catch (error) {
    console.error("Error updating subject:", error);
    throw new Error("Failed to update subject");
  }
}

export async function deleteSubject(subjectId: string) {
  try {
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw new Error("Failed to delete subject");
  }
}

export async function getSubjectsByUser(userId: string) {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createAt: "desc" },
    });

    return subjects;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw new Error("Failed to fetch subjects");
  }
}

export async function getSubjectWithNotes(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        notes: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return subject;
  } catch (error) {
    console.error("Error fetching subject with notes:", error);
    throw new Error("Failed to fetch subject");
  }
} 