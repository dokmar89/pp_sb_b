"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchShopAnalytics } from "@/lib/actions/analytics"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Loader2 } from "lucide-react"

interface ShopAnalyticsDialogProps {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AnalyticsData {
  stats: {
    total: number
    successful: number
    failed: number
    averageTime: number
    percentChange: number
  }
  timeSeries: Array<{
    date: string
    count: number
  }>
  methodBreakdown: Array<{
    method: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function ShopAnalyticsDialog({ shopId, open, onOpenChange }: ShopAnalyticsDialogProps) {
  const [timeRange, setTimeRange] = useState("week")
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (open && shopId) {
      loadAnalytics()
    }
  }, [open, shopId, timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const data = await fetchShopAnalytics(shopId, timeRange)
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast.error("Nepodařilo se načíst analytická data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const successRate = analyticsData ? 
    (analyticsData.stats.successful / analyticsData.stats.total * 100).toFixed(1) : "0"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Analytika ověření</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vyberte období" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Poslední den</SelectItem>
              <SelectItem value="week">Poslední týden</SelectItem>
              <SelectItem value="month">Poslední měsíc</SelectItem>
              <SelectItem value="year">Poslední rok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="methods">Metody ověření</TabsTrigger>
            <TabsTrigger value="reports">Měsíční reporty</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Celkem ověření
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.stats.total.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData?.stats.percentChange > 0 ? "+" : ""}
                    {analyticsData?.stats.percentChange}% oproti minulému období
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Úspěšnost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData?.stats.successful} úspěšných z {analyticsData?.stats.total}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Průměrná doba ověření
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(analyticsData?.stats.averageTime || 0).toFixed(2)}s
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vývoj počtu ověření</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData?.timeSeries || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle>Rozdělení podle metod ověření</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.methodBreakdown || []}
                        dataKey="count"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ method, percentage }) => 
                          `${method}: ${percentage.toFixed(1)}%`
                        }
                      >
                        {analyticsData?.methodBreakdown.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Měsíční reporty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {analyticsData?.timeSeries.map((data, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{data.date}</span>
                      <span>{data.count} ověření</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 