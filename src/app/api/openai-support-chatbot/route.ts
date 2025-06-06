import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const input = await req.json();

  // Compose your prompt using input
  const prompt = `You are a friendly and helpful support chatbot for a nutrition web app. Only answer questions about website functionality and features.\n\n${JSON.stringify(input)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const result = completion.choices[0]?.message?.content || '';

  return NextResponse.json({ botResponse: result });
} 