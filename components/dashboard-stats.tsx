import type { Tables } from "@/lib/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  verifications: Tables<"verifications">[] | null
}

export function DashboardStats({ verifications }: DashboardStatsProps) {
  const approved = verifications?.filter((v) => v.result === "success").length || 0
  const rejected = verifications?.filter((v) => v.result === "failure").length || 0
  const total = verifications?.length || 0
  
  const approvedPercentage = total > 0 ? Math.round((approved / total) * 100) : 0
  const rejectedPercentage = total > 0 ? Math.round((rejected / total) * 100) : 0

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5">
          <CardTitle className="text-sm font-medium">Schválená ověření</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{approved}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div 
              className="h-full rounded-full bg-emerald-500" 
              style={{ width: `${approvedPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {approvedPercentage}% úspěšnost ověření
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-500/10 to-red-500/5">
          <CardTitle className="text-sm font-medium">Zamítnutá ověření</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{rejected}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div 
              className="h-full rounded-full bg-red-500" 
              style={{ width: `${rejectedPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rejectedPercentage}% neúspěšnost ověření
          </p>
        </CardContent>
      </Card>
    </>
  )
}