"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface VerificationStats {
  total: number
  successful: number
  failed: number
  averageTime: number
  percentChange: number
}

interface TimeSeriesData {
  date: string
  count: number
}

interface MethodStats {
  method: string
  count: number
  percentage: number
}

interface AnalyticsData {
  stats: VerificationStats
  timeSeries: TimeSeriesData[]
  methodBreakdown: MethodStats[]
}

export async function fetchShopAnalytics(shopId: string, timeRange: string): Promise<AnalyticsData> {
  const supabase = createServerActionClient({ cookies })
  const now = new Date()
  let startDate = new Date()

  // Nastavení časového rozsahu
  switch (timeRange) {
    case "day":
      startDate.setDate(now.getDate() - 1)
      break
    case "week":
      startDate.setDate(now.getDate() - 7)
      break
    case "month":
      startDate.setMonth(now.getMonth() - 1)
      break
    case "year":
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  try {
    // Získání celkových statistik
    const { data: currentStats, error: statsError } = await supabase
      .from("verifications")
      .select("result, verification_time")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString())

    if (statsError) throw statsError

    // Získání dat pro časovou řadu
    const { data: timeSeriesData, error: timeSeriesError } = await supabase
      .from("verifications")
      .select("created_at, result")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (timeSeriesError) throw timeSeriesError

    // Získání statistik podle metod
    const { data: methodStats, error: methodsError } = await supabase
      .from("verifications")
      .select("method, count")
      .eq("shop_id", shopId)
      .gte("created_at", startDate.toISOString())
      .group_by("method")

    if (methodsError) throw methodsError

    // Zpracování dat
    const total = currentStats.length
    const successful = currentStats.filter(v => v.result === "success").length
    const averageTime = currentStats.reduce((acc, curr) => acc + (curr.verification_time || 0), 0) / total

    // Formátování dat pro grafy
    const timeSeries = processTimeSeriesData(timeSeriesData, timeRange)
    const methods = processMethodStats(methodStats, total)

    return {
      stats: {
        total,
        successful,
        failed: total - successful,
        averageTime,
        percentChange: 0 // TODO: Implementovat výpočet změny
      },
      timeSeries,
      methodBreakdown: methods
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    throw error
  }
}

function processTimeSeriesData(data: any[], timeRange: string): TimeSeriesData[] {
  if (!data?.length) return []

  const groupedData = data.reduce((acc, curr) => {
    const date = new Date(curr.created_at)
    let key: string

    switch (timeRange) {
      case "day":
        key = `${date.getHours()}:00`
        break
      case "week":
        key = date.toLocaleDateString('cs-CZ', { weekday: 'short' })
        break
      case "month":
        key = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
        break
      case "year":
        key = date.toLocaleDateString('cs-CZ', { month: 'short' })
        break
      default:
        key = date.toLocaleDateString()
    }

    if (!acc[key]) {
      acc[key] = { date: key, count: 0 }
    }
    acc[key].count++
    return acc
  }, {} as Record<string, TimeSeriesData>)

  return Object.values(groupedData)
}

function processMethodStats(data: any[], total: number): MethodStats[] {
  return data.map(item => ({
    method: item.method,
    count: item.count,
    percentage: (item.count / total) * 100
  }))
} 