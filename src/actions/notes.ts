"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { GoogleGenerativeAI } from '@google/generative-ai';

export const createNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to create a note");

    // Use createMany for better performance
    await prisma.note.create({
      data: {
        id: noteId,
        authorId: user.id,
        text: "",
        createAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true, // Only select the ID to minimize data transfer
      },
    });

    return { errorMessage: null };
  } catch (error) {
    console.error("Error creating note:", error);
    return handleError(error);
  }
};

export const createNoteWithContent = async (data: {
  title: string;
  text: string;
  authorId: string;
  subjectId: string;
  sourceType: "MANUAL" | "PDF";
  pdfUrl?: string;
}) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to create a note");

    // Use raw SQL to create the note since Prisma client doesn't recognize title field
    const noteId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Note" ("id", "title", "text", "authorId", "subjectId", "sourceType", "pdfUrl", "createAt", "updatedAt")
      VALUES (${noteId}, ${data.title}, ${data.text}, ${data.authorId}, ${data.subjectId}, ${data.sourceType}, ${data.pdfUrl}, NOW(), NOW())
    `;
    
    const note = { id: noteId, title: data.title, text: data.text };

    return { note, errorMessage: null };
  } catch (error) {
    console.error("Error creating note with content:", error);
    return { note: null, errorMessage: handleError(error).errorMessage };
  }
};

export const updateNoteAction = async (noteId: string, text: string, title?: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a note");

    // Use raw SQL to update the note since Prisma client doesn't recognize title field
    if (title !== undefined) {
      await prisma.$executeRaw`
        UPDATE "Note" 
        SET "text" = ${text}, "title" = ${title}, "updatedAt" = NOW()
        WHERE "id" = ${noteId} AND "authorId" = ${user.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "Note" 
        SET "text" = ${text}, "updatedAt" = NOW()
        WHERE "id" = ${noteId} AND "authorId" = ${user.id}
      `;
    }

    return { errorMessage: null };
  } catch (error) {
    console.error("Error updating note:", error);
    return handleError(error);
  }
};

export const deleteNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to delete a note");

    await prisma.note.delete({
      where: { id: noteId, authorId: user.id },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const askAIAboutNotesAction = async (
  newQuestions: string[],
  responses: string[],
) => {
  const user = await getUser();
  if (!user) throw new Error("You must be logged in to ask AI questions");

  const notes = await prisma.note.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { text: true, createAt: true, updatedAt: true },
  });

  if (notes.length === 0) {
    return "You don't have any notes yet.";
  }

  const formattedNotes = notes
    .map((note) =>
      `
      Text: ${note.text}
      Created at: ${note.createAt}
      Last updated: ${note.updatedAt}
      `.trim(),
    )
    .join("\n");

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Build conversation history
  let conversationHistory = `
    You are a helpful assistant that answers questions about a user's notes. 
    Assume all questions are related to the user's notes. 
    Make sure that your answers are not too verbose and you speak succinctly. 
    Your responses MUST be formatted in clean, valid HTML with proper structure. 
    Use tags like <p>, <strong>, <em>, <ul>, <ol>, <li>, <h1> to <h6>, and <br> when appropriate. 
    Do NOT wrap the entire response in a single <p> tag unless it's a single paragraph. 
    Avoid inline styles, JavaScript, or custom attributes.
    
    Here are the user's notes:
    ${formattedNotes}
    
    Previous conversation:
  `;

  // Add conversation history
  for (let i = 0; i < newQuestions.length; i++) {
    conversationHistory += `\nUser: ${newQuestions[i]}`;
    if (responses.length > i) {
      conversationHistory += `\nAssistant: ${responses[i]}`;
    }
  }

  // Add the latest question
  const latestQuestion = newQuestions[newQuestions.length - 1];
  const prompt = `${conversationHistory}\n\nUser: ${latestQuestion}\n\nAssistant:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text() || "A problem has occurred";
    
    // Clean up unwanted prefixes/suffixes (ES2015 compatible)
    responseText = responseText
      .replace(/^```html\s*/i, '') 
      .replace(/\s*```$/i, '')     
      .replace(/^html\s*/i, '')    
      .replace(/^\s*<html>[\s\S]*?<body[^>]*>/i, '') 
      .replace(/<\/body>[\s\S]*?<\/html>\s*$/i, '')  
      .trim();
    
    return responseText;
  } catch (error) {
    console.error('Gemini API error:', error);
    return "A problem has occurred while processing your request.";
  }
};