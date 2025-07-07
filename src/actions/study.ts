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

Format the response as an HTML table with the following structure:
<table>
<thead>
<tr>
<th>Day</th>
<th>Date</th>
<th>Task Description</th>
<th>Duration</th>
<th>Type</th>
<th>Priority</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>Today + 0 days</td>
<td>Specific task description here</td>
<td>45 min</td>
<td>Review</td>
<td>High</td>
</tr>
...continue for all ${daysUntilExam} days
</tbody>
</table>

Task Types to use: Review, Practice, New Material, Quiz/Assessment, Final Review
Priority Levels: High, Medium, Low

Make sure to:
- Include realistic, specific task descriptions
- Vary the task types appropriately 
- Assign higher priority to foundational concepts early and review sessions near the exam
- Include regular practice and assessment days
- Make the plan progressive and logical

Only return the HTML table, no additional text or formatting.`;

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the HTML table response
    const cleanedText = text.trim().replace(/```html|```/g, '');
    
    // Save the study plan to the database (store as HTML string)
    await prisma.studyPlan.create({
      data: {
        userId,
        subjectId,
        planData: {
          subjectId,
          subjectName: subject.name,
          htmlTable: cleanedText,
          totalDays: daysUntilExam,
          studyStyle: options.studyStyle,
          dailyStudyTime: options.dailyStudyTime,
          createdAt: new Date().toISOString()
        },
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
    return cleanedText;
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
    // Quiz generation is now free for all users - no usage limit check needed

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

    // Quiz is free - no usage increment needed

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

// Personalized study tip generation using AI
export async function generatePersonalizedStudyTip(
  userId: string,
  userProfile: {
    studyStyle: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
    dailyStudyTime: number;
    streakCount: number;
  },
  subjects: Array<{
    name: string;
    examDate: Date | null;
    quizFrequency: number;
    noteCount: number;
    lastStudied?: Date;
  }>
) {
  try {
    // Analyze user's study pattern
    const totalNotes = subjects.reduce((sum, subject) => sum + subject.noteCount, 0);
    const upcomingExams = subjects.filter(s => {
      if (!s.examDate) return false;
      const daysUntilExam = Math.ceil((new Date(s.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExam > 0 && daysUntilExam <= 30;
    });
    
    const currentDate = new Date();
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = currentDate.getHours() < 12 ? 'morning' : currentDate.getHours() < 18 ? 'afternoon' : 'evening';

    const prompt = `You are a personalized study coach. Based on the student's profile and current situation, provide ONE specific, actionable study tip.

Student Profile:
- Study Style: ${userProfile.studyStyle}
- Daily Study Goal: ${userProfile.dailyStudyTime} minutes
- Current Streak: ${userProfile.streakCount} days
- Total Notes: ${totalNotes}
- Current Day: ${dayOfWeek} ${timeOfDay}

Subjects (${subjects.length} total):
${subjects.map(s => {
  const daysUntilExam = s.examDate ? Math.ceil((new Date(s.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  return `- ${s.name}: ${s.noteCount} notes, ${daysUntilExam ? `exam in ${daysUntilExam} days` : 'no exam set'}, quiz frequency: every ${s.quizFrequency} days`;
}).join('\n')}

Upcoming Exams: ${upcomingExams.length > 0 ? upcomingExams.map(e => `${e.name} in ${Math.ceil((new Date(e.examDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`).join(', ') : 'None'}

Requirements:
- Provide ONLY ONE tip, maximum 2 sentences
- Make it specific to their study style and current situation
- Focus on immediate actionable advice
- Consider their streak, upcoming exams, and note-taking patterns
- Be encouraging but practical
- Don't use asterisks or markdown formatting

Examples of good tips:
- "Since you're a visual learner with 3 upcoming exams, try creating a color-coded timeline this evening to map out your review schedule."
- "With your 7-day streak and audio learning style, record yourself summarizing your Mathematics notes during your 60-minute study session today."
- "Given your practice-focused approach and the Chemistry exam in 5 days, dedicate 30 minutes today to solving past problems rather than re-reading notes."

Generate one personalized tip now:`;

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tip = response.text();

    // Log the tip generation for analytics
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "STUDY_TIP_GENERATED",
      },
    });

    return {
      success: true,
      tip: tip.trim(),
      generated: new Date(),
    };
  } catch (error) {
    console.error("Error generating study tip:", error);
    
    // Fallback to a basic tip based on profile
    const fallbackTips = {
      VISUAL: "Create a visual mind map of your most challenging subject to better organize your thoughts and improve retention.",
      READING: "Set aside 15 minutes today to summarize your most recent notes in your own words to reinforce learning.",
      PRACTICE: "Choose your weakest subject and spend 20 minutes doing practice problems or creating flashcards today.",
      TEACHING: "Pick one concept from today's notes and explain it out loud as if teaching someone else.",
      AUDIO: "Record yourself reading your key notes aloud and listen back during breaks or commute time."
    };
    
    return {
      success: true,
      tip: fallbackTips[userProfile.studyStyle] || "Take a 5-minute break between study sessions to help your brain process and retain information better.",
      generated: new Date(),
      fallback: true,
    };
  }
}