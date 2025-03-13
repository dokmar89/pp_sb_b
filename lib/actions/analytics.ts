"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Definice rozhraní pro výsledky a analytiku
export interface VerificationStats {
  total: number;
  successful: number;
  failed: number;
  averageTime: number;
  percentChange: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
}

export interface MethodStats {
  method: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  stats: VerificationStats;
  timeSeries: TimeSeriesData[];
  methodBreakdown: MethodStats[];
}

// Specifické typy pro data z databáze
interface VerificationRow {
  result: string;
  verification_time?: number;
  created_at: string;
}

interface MethodStatsRow {
  method: string;
  count: number;
}

export async function fetchShopAnalytics(
  shopId: string,
  timeRange: string
): Promise<AnalyticsData> {
  // Input Validation
  if (!shopId || typeof shopId !== "string") {
    throw new Error("Invalid shopId provided");
  }
  const validTimeRanges = ["day", "week", "month", "year"];
  if (!validTimeRanges.includes(timeRange)) {
    throw new Error(
      `Invalid timeRange provided. Valid options are: ${validTimeRanges.join(", ")}`
    );
  }

  const supabase = createServerActionClient({ cookies });
  const now = new Date();
  let startDate = new Date();

  // Nastavení časového rozsahu
  switch (timeRange) {
    case "day":
      startDate.setDate(now.getDate() - 1);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // Díky validaci by tento blok neměl nastat, ale pro jistotu:
      throw new Error("Unsupported time range");
  }

  try {
    // Získání celkových statistik
    const { data: currentStats, error: statsError } = await supabase
      .from("verifications")
      .select("result, verification_time, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString());

    if (statsError || !currentStats) {
      throw statsError || new Error("Failed to fetch verification statistics");
    }

    // Získání dat pro časovou řadu
    const { data: timeSeriesData, error: timeSeriesError } = await supabase
      .from("verifications")
      .select("created_at, result")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (timeSeriesError || !timeSeriesData) {
      throw timeSeriesError || new Error("Failed to fetch time series data");
    }

    // Získání statistik podle metod
    const { data: rawMethodStats, error: methodsError } = await supabase
      .from("verifications")
      .select("method, count")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString())
      .group_by("method");
    if (methodsError || !rawMethodStats) {
      throw methodsError || new Error("Failed to fetch method statistics");
    }

    // Zpracování dat
    const total = currentStats.length;
    const successful = currentStats.filter(
      (v: VerificationRow) => v.result === "success"
    ).length;
    const averageTime =
      total > 0
        ? currentStats.reduce(
            (acc: number, curr: VerificationRow) =>
              acc + (curr.verification_time || 0),
            0
          ) / total
        : 0;

    // Formátování dat pro grafy
    const timeSeries = processTimeSeriesData(
      timeSeriesData as VerificationRow[],
      timeRange
    );
    const methods = processMethodStats(rawMethodStats as MethodStatsRow[], total);

    return {
      stats: {
        total,
        successful,
        failed: total - successful,
        averageTime,
        percentChange: 0, // TODO: Implementovat výpočet procentuální změny
      },
      timeSeries,
      methodBreakdown: methods,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
}

function processTimeSeriesData(
  data: VerificationRow[],
  timeRange: string
): TimeSeriesData[] {
  if (!data?.length) return [];

  const groupedData = data.reduce(
    (acc: Record<string, TimeSeriesData>, curr: VerificationRow) => {
      const date = new Date(curr.created_at);
      let key: string;

      switch (timeRange) {
        case "day":
          key = `${date.getHours()}:00`;
          break;
        case "week":
          key = date.toLocaleDateString("cs-CZ", { weekday: "short" });
          break;
        case "month":
          key = date.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
          });
          break;
        case "year":
          key = date.toLocaleDateString("cs-CZ", { month: "short" });
          break;
        default:
          key = date.toLocaleDateString();
      }

      if (!acc[key]) {
        acc[key] = { date: key, count: 0 };
      }
      acc[key].count++;
      return acc;
    },
    {} as Record<string, TimeSeriesData>
  );

  return Object.values(groupedData);
}

function processMethodStats(
  data: MethodStatsRow[],
  total: number
): MethodStats[] {
  return data.map((item) => ({
    method: item.method,
    count: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));
}
