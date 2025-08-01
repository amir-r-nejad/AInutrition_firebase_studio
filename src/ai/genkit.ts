import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import openAI, { gpt4 } from 'genkitx-openai';

export const geminiModel = genkit({
  plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY })],
  model: googleAI.model('gemini-2.0-flash'),
});

export const openaiModel = genkit({
  plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })],
  model: gpt4,
});
