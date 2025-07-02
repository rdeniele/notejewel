"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import gemini from "@/gemini";

export async function generateStudyPlan(
  userId: string,
  subjectId: string,
  options: {
    studyStyle: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
    dailyStudyTime: number;
  }
) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        notes: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }

    const notesContent = subject.notes.map(note => note.text).join("\n\n");
    const daysUntilExam = subject.examDate 
      ? Math.ceil((subject.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 14; // Default to 2 weeks if no exam date

    const prompt = `Create a personalized study plan for ${subject.name} based on the following:

Study Style: ${options.studyStyle}
Daily Study Time: ${options.dailyStudyTime} minutes
Days until exam: ${daysUntilExam}
Available notes: ${notesContent}

Generate a ${daysUntilExam}-day study plan with specific tasks for each day. Each task should:
1. Be appropriate for the ${options.studyStyle} learning style
2. Take approximately ${Math.floor(options.dailyStudyTime / 2)}-${options.dailyStudyTime} minutes
3. Include a mix of review, practice, and new material
4. Be specific and actionable

Format the response as a JSON object with this structure:
{
  "subjectId": "${subjectId}",
  "subjectName": "${subject.name}",
  "tasks": [
    {
      "day": 1,
      "task": "Specific task description",
      "duration": 45,
      "type": "REVIEW|PRACTICE|NEW_MATERIAL"
    }
  ],
  "totalDays": ${daysUntilExam}
}

Focus on creating a realistic, achievable plan that builds knowledge progressively.`;

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }
    
    const studyPlan = JSON.parse(jsonMatch[0]);

    // Save the study plan to the database
    await prisma.studyPlan.create({
      data: {
        userId,
        subjectId,
        planData: studyPlan,
      },
    });

    // Log the study plan creation
    await prisma.studyLog.create({
      data: {
        userId,
        subjectId,
        actionType: "STUDY_PLAN_CREATED",
      },
    });

    revalidatePath("/");
    return studyPlan;
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate study plan");
  }
}

export async function generateQuiz(
  userId: string,
  subjectId: string,
  noteIds?: string[]
) {
  try {
    let notesContent = "";
    
    if (noteIds && noteIds.length > 0) {
      const notes = await prisma.note.findMany({
        where: { id: { in: noteIds } },
      });
      notesContent = notes.map(note => note.text).join("\n\n");
    } else {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          notes: {
            orderBy: { updatedAt: "desc" },
            take: 5, // Use the 5 most recent notes
          },
        },
      });
      
      if (!subject) {
        throw new Error("Subject not found");
      }
      
      notesContent = subject.notes.map(note => note.text).join("\n\n");
    }

    const prompt = `Based on the following study material, generate 5 quiz questions:

${notesContent}

Generate 5 multiple-choice questions that test understanding of the key concepts. Each question should have 4 options (A, B, C, D) with only one correct answer.

Format the response as a JSON object:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "A": "Option A",
        "B": "Option B", 
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Make the questions challenging but fair, covering different aspects of the material.`;

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }
    
    const quiz = JSON.parse(jsonMatch[0]);

    // Log the quiz generation
    await prisma.studyLog.create({
      data: {
        userId,
        subjectId,
        actionType: "AI_QUIZ",
      },
    });

    return quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function generateConceptMap(
  userId: string,
  subjectId: string,
  noteIds?: string[]
) {
  try {
    let notesContent = "";
    
    if (noteIds && noteIds.length > 0) {
      const notes = await prisma.note.findMany({
        where: { id: { in: noteIds } },
      });
      notesContent = notes.map(note => note.text).join("\n\n");
    } else {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          notes: {
            orderBy: { updatedAt: "desc" },
            take: 10,
          },
        },
      });
      
      if (!subject) {
        throw new Error("Subject not found");
      }
      
      notesContent = subject.notes.map(note => note.text).join("\n\n");
    }

    const prompt = `Create a concept map based on the following study material:

${notesContent}

Organize the key concepts and their relationships in a hierarchical structure. Use bullet points and indentation to show relationships.

Format as a structured outline with main concepts, sub-concepts, and their connections. Focus on the most important ideas and how they relate to each other.

Example format:
• Main Concept 1
  - Sub-concept 1.1
    * Related detail
  - Sub-concept 1.2
• Main Concept 2
  - Sub-concept 2.1
    * Related detail

Make it clear and easy to understand the relationships between concepts.`;

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Log the concept map generation
    await prisma.studyLog.create({
      data: {
        userId,
        subjectId,
        actionType: "AI_CONCEPT_MAP",
      },
    });

    return text;
  } catch (error) {
    console.error("Error generating concept map:", error);
    throw new Error("Failed to generate concept map");
  }
}

export async function logStudyActivity(
  userId: string,
  actionType: "NOTE_CREATED" | "NOTE_UPDATED" | "QUIZ_TAKEN" | "STUDY_PLAN_COMPLETED" | "SUBJECT_VIEWED",
  subjectId?: string,
  noteId?: string
) {
  try {
    await prisma.studyLog.create({
      data: {
        userId,
        subjectId,
        noteId,
        actionType,
      },
    });

    // Update user streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: new Date(),
      },
    });

    revalidatePath("/");
  } catch (error) {
    console.error("Error logging study activity:", error);
  }
} 