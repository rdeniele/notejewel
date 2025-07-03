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
    // Check usage limit first - using temporary billing functions
    const { checkUserUsageLimit, incrementUsage } = await import("@/actions/billing");
    const usageCheck = await checkUserUsageLimit(userId);
    
    if (!usageCheck.canGenerate) {
      throw new Error(`Daily limit reached. You have ${usageCheck.remaining} generations remaining.`);
    }

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

    // Increment usage count - using temporary billing functions
    await incrementUsage(userId);

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
    // Check usage limit first - using temporary billing functions
    const { checkUserUsageLimit, incrementUsage } = await import("@/actions/billing");
    const usageCheck = await checkUserUsageLimit(userId);
    
    if (!usageCheck.canGenerate) {
      throw new Error(`Daily limit reached. You have ${usageCheck.remaining} generations remaining.`);
    }

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

    // Increment usage count - using temporary billing functions
    await incrementUsage(userId);

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
    // Check usage limit first - using temporary billing functions
    const { checkUserUsageLimit, incrementUsage } = await import("@/actions/billing");
    const usageCheck = await checkUserUsageLimit(userId);
    
    if (!usageCheck.canGenerate) {
      throw new Error(`Daily limit reached. You have ${usageCheck.remaining} generations remaining.`);
    }

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

    const prompt = `Create a comprehensive concept map based on the following study material. Extract the key concepts and organize them into a clear hierarchical structure that shows relationships between ideas.

STUDY MATERIAL:
${notesContent}

INSTRUCTIONS:
- Identify 3-7 main concepts from the material
- For each main concept, identify 2-5 sub-concepts that relate to it
- For important sub-concepts, add 1-3 specific details, examples, or related terms
- Use descriptive concept names that include important keywords
- Include concepts that might relate to each other across different branches
- Use EXACTLY this format with proper indentation:

• [Main Concept 1 - use descriptive terms]
  - [Sub-concept 1.1 - related process/method]
    * [Specific detail or example]
    * [Another related detail]
  - [Sub-concept 1.2 - outcome/result]
    * [Specific application]
• [Main Concept 2 - another key area]
  - [Sub-concept 2.1 - component/element]
    * [Detail that might relate to other concepts]
  - [Sub-concept 2.2 - related system/framework]

RELATIONSHIP GUIDELINES:
- Include concepts that show cause-effect relationships
- Add concepts that demonstrate part-whole relationships  
- Use terms that might connect across different main concepts
- Include action words (process, method, technique) and object words (data, result, outcome)
- Mention related terms that could link different areas

IMPORTANT:
- Use • for main concepts (level 0)
- Use - for sub-concepts (level 1) 
- Use * for details/examples (level 2)
- Keep concepts concise but include key connecting terms
- Focus on relationships that span across different concept areas
- Use terminology that will help identify conceptual connections

Create a map where concepts naturally connect through shared terminology and relationships.`;

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

    // Increment usage count - using temporary billing functions
    await incrementUsage(userId);

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