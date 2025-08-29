import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://optimization-system-for-ai-nutrition.onrender.com/test-rag-connection",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: "External API is accessible",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test API connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "External API connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
