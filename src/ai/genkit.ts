import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// The model is specified by its string identifier.
// The full identifier includes the provider, e.g., 'googleai/gemini-2.0-flash'.
export const geminiModel = 'googleai/gemini-2.0-flash';

// Genkit AI initialization
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY })],
  // The 'model' property in the main config sets the default model for all operations.
  // It expects a string identifier.
  model: geminiModel,
});
