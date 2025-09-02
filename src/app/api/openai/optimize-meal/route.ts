import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 OpenAI Meal Optimization API - POST request received");

    const body = await request.json();
    const { prompt, targetMacros, mealType } = body;

    if (!prompt || !targetMacros) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: prompt or targetMacros',
          status: 'error'
        },
        { status: 400 }
      );
    }

    // Validate target macros
    if (
      typeof targetMacros.calories !== 'number' ||
      typeof targetMacros.protein !== 'number' ||
      typeof targetMacros.carbs !== 'number' ||
      typeof targetMacros.fat !== 'number'
    ) {
      return NextResponse.json(
        { 
          error: 'Invalid target macros - all values must be numbers',
          status: 'error'
        },
        { status: 400 }
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not found in environment variables',
          status: 'error'
        },
        { status: 500 }
      );
    }

    console.log('✅ Request validation passed');
    console.log('🔍 Processing OpenAI optimization request...');

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
                 messages: [
           {
             role: "system",
             content: "You are an expert AI nutritionist and optimization specialist with expertise in mathematical optimization algorithms including PuLP (Linear Programming), Genetic Algorithms, and Hybrid methods. Your task is to optimize meal ingredients to EXACTLY match target macronutrients using precise mathematical calculations. Always respond with valid JSON only, no additional text or formatting. Calculate exact ingredient quantities, not fixed amounts."
           },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(
        `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Clean and parse JSON response
    let cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", cleanedContent);
      throw new Error("OpenAI response is not valid JSON");
    }

    // Handle both nested and flat structures for backward compatibility
    let finalResult = parsedResult;
    
    // If the AI returned nested structure, flatten it
    if (parsedResult.optimized_meal && parsedResult.optimized_meal.ingredients) {
      console.log('🔄 Converting nested structure to flat structure');
      finalResult = {
        meal_name: parsedResult.optimized_meal.meal_name,
        ingredients: parsedResult.optimized_meal.ingredients,
        total_macros: parsedResult.optimized_meal.total_macros,
        optimization_method: parsedResult.optimization_method || 'genetic_algorithm',
        explanation: parsedResult.explanation || 'AI optimization completed',
        target_achievement: parsedResult.target_achievement || 'Targets optimized'
      };
    }
    
    // Validate the response structure
    if (!finalResult.ingredients || !finalResult.total_macros) {
      throw new Error("OpenAI response missing required fields");
    }

    console.log('✅ OpenAI optimization completed successfully');
    console.log('📊 Optimization result:', finalResult);

    return NextResponse.json({
      success: true,
      data: finalResult,
      status: 'success'
    });

  } catch (error: any) {
    console.error('❌ OpenAI Meal Optimization API Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error occurred during optimization',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
