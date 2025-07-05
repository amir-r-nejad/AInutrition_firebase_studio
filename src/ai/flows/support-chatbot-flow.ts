'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'zod';

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
  return supportChatbotFlow(input.userQuery);
}

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'forceResponsePrompt',
  input: {
    schema: z.object({
      userQuery: z.string(),
    }),
  },
  output: {
    schema: z.object({
      botResponse: z.string(),
    }),
  },
  prompt: `INSTRUCTIONS: Read the user's question and respond immediately with specific help. DO NOT ask what they need help with.

USER QUESTION: {{userQuery}}

RESPONSE RULES:
- If question contains "dashboard" or "Dashboard": "The Dashboard provides an overview of your progress, key metrics, and quick access to important sections of NutriPlan. It's your central hub for tracking your nutrition journey and accessing all major features."
- If question contains "profile" or "Profile": "The Profile page is where you manage your personal information in NutriPlan. Here you can update your medical information, set exercise preferences, and track physical metrics like weight and height."
- If question contains "calorie": "The Smart Calorie Planner helps you set personalized daily calorie and macronutrient targets based on your goals."
- If question contains "meal": "NutriPlan offers Meal Suggestions with AI-powered ideas, Current Meal Plan for managing your weekly plan, and AI Meal Plan for generating optimized plans."

FORBIDDEN: Never ask "what do you need help with" or "tell me what you need help with"

RESPOND TO: {{userQuery}}`,
});

const supportChatbotFlow = ai.defineFlow(
  {
    name: 'supportChatbotFlow',
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (input: SupportChatbotInput): Promise<SupportChatbotOutput> => {
    console.log(input);

    try {
      const { output } = await prompt(input);

      return output as SupportChatbotOutput;
    } catch (error) {
      console.error(error);

      return {
        botResponse:
          "I'm sorry, I couldn't process your request at the moment. Please try again.",
      };
    }
  }
);
