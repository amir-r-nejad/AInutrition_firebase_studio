import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const geminiModel = googleAI.model('gemini-2.0-flash');

// Genkit AI initialization
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY })],
  model: geminiModel,
});
