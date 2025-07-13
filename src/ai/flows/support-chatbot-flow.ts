
'use server';

import { ai, geminiModel } from '@/ai/genkit';

// Types
export interface SupportChatbotInput {
  userQuery: string;
}

export interface SupportChatbotOutput {
  botResponse: string;
}

// Main entry function

export async function handleSupportQuery(
  input: SupportChatbotInput
): Promise<SupportChatbotOutput> {
  return supportChatbotFlow(input);
}

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'supportChatbotPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are a friendly and helpful support chatbot for "NutriPlan", a web application for personalized nutrition and meal planning.

User Query: {{{input}}}

Your task is to analyze the user's question and provide specific, actionable help about NutriPlan features.

KNOWLEDGE BASE:
- Dashboard: Overview of progress, key metrics, and quick access to important sections. Your central hub for tracking nutrition journey.
- Profile: Manage personal information, medical details, exercise preferences, and physical metrics like weight and height.
- Smart Calorie Planner: Set personalized daily calorie and macronutrient targets based on your goals.
- Meal Suggestions: AI-powered meal ideas and recommendations.
- Current Meal Plan: Manage and view your weekly meal plan.
- AI Meal Plan: Generate optimized meal plans using AI.

RESPONSE GUIDELINES:
1. Be direct and specific about the relevant feature
2. Provide actionable information
3. Keep responses concise but helpful
4. Focus on what the user can do with the feature
5. Do not ask follow-up questions

USER QUESTION: {{userQuery}}

Provide a helpful response about the relevant NutriPlan feature:`,
});

const supportChatbotFlow = ai.defineFlow(
  {
    name: 'supportChatbotFlow',
    inputSchema: SupportChatbotInputSchema,
    outputSchema: SupportChatbotOutputSchema,
  },
  async (input: SupportChatbotInput): Promise<SupportChatbotOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        botResponse:
          "I'm sorry, I couldn't process your request at the moment. Please try again.",
      };
    }
    return output as SupportChatbotOutput;
  }
);
