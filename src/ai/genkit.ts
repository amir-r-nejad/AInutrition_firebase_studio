import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const geminiModel = googleAI.model('gemini-2.0-flash');

// Genkit AI initialization
export const ai = genkit({
  plugins: [googleAI({ apiKey: "AIzaSyAK-OoHH9BEmqNN1vtZf7f8O4uNbAvewD0" })],
  model: geminiModel,
});
