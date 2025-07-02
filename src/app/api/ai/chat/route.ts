import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, noteContent, noteTitle, action, conversationHistory } = await request.json();

    if (!message || !noteContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const gemini = new GoogleGenerativeAI(apiKey);
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    let context = noteContent;
    if (conversationHistory && conversationHistory.length > 0) {
      context += "\n\nPrevious conversation:\n" + conversationHistory.map((msg: { role: string; content: string }) => 
        `${msg.role}: ${msg.content}`
      ).join("\n");
    }

    const prompt = `Based on the following study material, please help with the user's request:

Study Material:
${context}

User Request: ${message}

Please provide a helpful, accurate response based on the study material provided.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    return NextResponse.json({
      success: true,
      response: responseText
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 