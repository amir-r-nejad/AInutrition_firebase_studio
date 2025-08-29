import { NextRequest, NextResponse } from "next/server";
import { MEAL_OPTIMIZATION_CONFIG } from "@/lib/config/meal-optimization";

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// In-memory metrics storage (in production, use Redis or database)
class OptimizationMetrics {
  private static metrics: Map<string, any[]> = new Map();
  private static startTimes: Map<string, number> = new Map();

  static startOptimization(requestId: string) {
    this.startTimes.set(requestId, Date.now());
  }

  static endOptimization(
    requestId: string,
    success: boolean,
    methodUsed: string,
    targetAchievement: any,
    endpointUsed: string,
  ) {
    if (this.startTimes.has(requestId)) {
      const duration = Date.now() - this.startTimes.get(requestId)!;

      const metric = {
        timestamp: new Date().toISOString(),
        request_id: requestId,
        duration,
        success,
        method_used: methodUsed,
        endpoint_used: endpointUsed,
        target_achievement: targetAchievement,
        ...targetAchievement,
      };

      // Store metrics by date for easy querying
      const dateKey = new Date().toISOString().split("T")[0];
      if (!this.metrics.has(dateKey)) {
        this.metrics.set(dateKey, []);
      }
      this.metrics.get(dateKey)!.push(metric);

      // Clean up old data (keep last 30 days)
      this.cleanupOldData();

      this.startTimes.delete(requestId);
    }
  }

  static getPerformanceSummary(hours: number = 24) {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const allMetrics: any[] = [];

    // Collect metrics from all dates
    for (const [date, metrics] of this.metrics.entries()) {
      const dateMetrics = metrics.filter(
        (m) => new Date(m.timestamp).getTime() > cutoffTime,
      );
      allMetrics.push(...dateMetrics);
    }

    if (allMetrics.length === 0) {
      return {
        total_optimizations: 0,
        success_rate: 0,
        avg_duration: 0,
        min_duration: 0,
        max_duration: 0,
        method_distribution: {},
        endpoint_distribution: {},
        macro_achievement_rates: {},
        recent_activity: [],
      };
    }

    const durations = allMetrics.map((m) => m.duration);
    const successful = allMetrics.filter((m) => m.success);

    // Calculate method distribution
    const methodCounts: { [key: string]: number } = {};
    allMetrics.forEach((m) => {
      methodCounts[m.method_used] = (methodCounts[m.method_used] || 0) + 1;
    });

    // Calculate endpoint distribution
    const endpointCounts: { [key: string]: number } = {};
    allMetrics.forEach((m) => {
      endpointCounts[m.endpoint_used] =
        (endpointCounts[m.endpoint_used] || 0) + 1;
    });

    // Calculate macro achievement rates
    const macroAchievementRates: { [key: string]: number } = {};
    ["calories", "protein", "carbs", "fat"].forEach((macro) => {
      const achieved = allMetrics.filter((m) => m[macro]).length;
      macroAchievementRates[macro] = (achieved / allMetrics.length) * 100;
    });

    // Get recent activity (last 10 requests)
    const recentActivity = allMetrics
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10)
      .map((m) => ({
        timestamp: m.timestamp,
        success: m.success,
        method: m.method_used,
        endpoint: m.endpoint_used,
        duration: m.duration,
      }));

    return {
      total_optimizations: allMetrics.length,
      success_rate: (successful.length / allMetrics.length) * 100,
      avg_duration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min_duration: Math.min(...durations),
      max_duration: Math.max(...durations),
      method_distribution: methodCounts,
      endpoint_distribution: endpointCounts,
      macro_achievement_rates: macroAchievementRates,
      recent_activity: recentActivity,
    };
  }

  static getDetailedMetrics(date: string) {
    return this.metrics.get(date) || [];
  }

  static getSystemHealth() {
    const summary = this.getPerformanceSummary(1); // Last hour

    let healthStatus = "healthy";
    let issues: string[] = [];

    if (summary.total_optimizations > 0) {
      if (summary.success_rate < 80) {
        healthStatus = "warning";
        issues.push(`Low success rate: ${summary.success_rate.toFixed(1)}%`);
      }

      if (summary.avg_duration > 30000) {
        // 30 seconds
        healthStatus = "warning";
        issues.push(
          `High average response time: ${(summary.avg_duration / 1000).toFixed(1)}s`,
        );
      }
    }

    return {
      status: healthStatus,
      issues,
      last_optimization:
        summary.recent_activity[0]?.timestamp || "No recent activity",
      uptime: "100%", // In production, calculate actual uptime
      external_service_status: "connected", // In production, check actual status
    };
  }

  private static cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [date] of this.metrics.entries()) {
      if (new Date(date) < thirtyDaysAgo) {
        this.metrics.delete(date);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Meal Optimization Metrics API - GET request received");

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24");
    const date = searchParams.get("date");
    const detailed = searchParams.get("detailed") === "true";

    if (date) {
      // Get metrics for specific date
      const metrics = OptimizationMetrics.getDetailedMetrics(date);
      return addCorsHeaders(
        NextResponse.json({
          date,
          metrics,
          count: metrics.length,
          status: "success",
        }),
      );
    }

    // Get performance summary
    const performanceSummary = OptimizationMetrics.getPerformanceSummary(hours);
    const systemHealth = OptimizationMetrics.getSystemHealth();

    const response = {
      status: "success",
      time_period: `${hours} hours`,
      timestamp: new Date().toISOString(),
      performance_summary: performanceSummary,
      system_health: systemHealth,
      service_info: {
        name: "AI Nutrition Meal Optimization Metrics",
        version: "1.0.0",
        metrics_collection: "enabled",
        data_retention: "30 days",
        real_time: true,
      },
    };

    if (detailed) {
      // Add detailed breakdown
      response.detailed_breakdown = {
        method_performance: Object.entries(
          performanceSummary.method_distribution,
        ).map(([method, count]) => ({
          method,
          count,
          percentage: (count / performanceSummary.total_optimizations) * 100,
        })),
        endpoint_performance: Object.entries(
          performanceSummary.endpoint_distribution,
        ).map(([endpoint, count]) => ({
          endpoint,
          count,
          percentage: (count / performanceSummary.total_optimizations) * 100,
        })),
        macro_achievement_breakdown: performanceSummary.macro_achievement_rates,
      };
    }

    return addCorsHeaders(NextResponse.json(response));
  } catch (error) {
    console.error("❌ Meal optimization metrics API error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(
      "📊 Meal Optimization Metrics API - POST request received (Record Metric)",
    );

    const body = await request.json();
    const {
      request_id,
      success,
      method_used,
      target_achievement,
      endpoint_used,
    } = body;

    if (!request_id || typeof success !== "boolean") {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Missing required fields: request_id and success",
            status: "error",
          },
          { status: 400 },
        ),
      );
    }

    // Record the metric
    OptimizationMetrics.endOptimization(
      request_id,
      success,
      method_used || "Unknown",
      target_achievement || {},
      endpoint_used || "Unknown",
    );

    console.log(`✅ Metric recorded for request: ${request_id}`);

    return addCorsHeaders(
      NextResponse.json({
        status: "success",
        message: "Metric recorded successfully",
        request_id,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("❌ Meal optimization metrics API POST error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}
