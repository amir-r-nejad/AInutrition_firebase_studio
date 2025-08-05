import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to allow environment variables to be loaded first
let genAI: GoogleGenerativeAI | null = null;
let geminiDirectModel: any = null;

function initializeGeminiClient() {
  if (genAI) return; // Already initialized

  // Validate Gemini API key - ensure we're running server-side
  const GEMINI_API_KEY =
    typeof window === "undefined" ? process.env.NEXT_PUBLIC_GEMINI_KEY : null;
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in environment variables");
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  if (!GEMINI_API_KEY.startsWith("AIza")) {
    console.error(
      '❌ GEMINI_API_KEY format is invalid. Should start with "AIza"',
    );
    throw new Error("Invalid GEMINI_API_KEY format");
  }

  console.log("✅ GEMINI_API_KEY is properly configured for direct API");

  // Initialize the Google Generative AI client
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // Get the Gemini model
  geminiDirectModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });
}

// Export a getter function for the model
export function getGeminiDirectModel() {
  initializeGeminiClient();
  return geminiDirectModel;
}

// Helper function to generate content with structured output
export async function generateStructuredContent<T>(
  prompt: string,
  schema?: any,
): Promise<T> {
  try {
    const model = getGeminiDirectModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text);

      // If schema is provided, validate the response
      if (schema) {
        const validationResult = schema.safeParse(parsed);
        if (!validationResult.success) {
          console.error("Schema validation failed:", validationResult.error);
          throw new Error(
            `AI response validation failed: ${validationResult.error.message}`,
          );
        }
        return validationResult.data;
      }

      return parsed;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", text);
      throw new Error("AI response is not valid JSON");
    }
  } catch (error: any) {
    console.error("Error generating content with Gemini Direct API:", error);

    // Handle specific API errors
    if (error.status === 403) {
      throw new Error(
        "API access forbidden. Please check your API key permissions and billing setup.",
      );
    } else if (error.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    } else if (error.status === 400) {
      throw new Error("Invalid request. Please check your input parameters.");
    } else if (error.status === 401) {
      throw new Error(
        "API key is invalid or expired. Please check your GEMINI_API_KEY.",
      );
    } else if (error.status >= 500) {
      throw new Error("Gemini API server error. Please try again later.");
    } else if (error.message?.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw new Error(
      `Gemini API error: ${error.message || "Unknown error occurred"}`,
    );
  }
}

// Helper function for simple text generation
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = getGeminiDirectModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error generating text with Gemini Direct API:", error);

    // Handle specific API errors
    if (error.status === 403) {
      throw new Error(
        "API access forbidden. Please check your API key permissions and billing setup.",
      );
    } else if (error.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    } else if (error.status === 400) {
      throw new Error("Invalid request. Please check your input parameters.");
    } else if (error.status === 401) {
      throw new Error(
        "API key is invalid or expired. Please check your GEMINI_API_KEY.",
      );
    } else if (error.status >= 500) {
      throw new Error("Gemini API server error. Please try again later.");
    } else if (error.message?.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw new Error(
      `Gemini API error: ${error.message || "Unknown error occurred"}`,
    );
  }
}
