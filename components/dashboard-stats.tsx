import type { Tables } from "@/lib/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  verifications: Tables<"verifications">[] | null
}

export function DashboardStats({ verifications }: DashboardStatsProps) {
  const approved = verifications?.filter((v) => v.result === "success").length || 0
  const rejected = verifications?.filter((v) => v.result === "failure").length || 0

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Schválená ověření</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approved}</div>
          <p className="text-xs text-muted-foreground">Celkový počet úspěšných ověření</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Zamítnutá ověření</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rejected}</div>
          <p className="text-xs text-muted-foreground">Celkový počet neúspěšných ověření</p>
        </CardContent>
      </Card>
    </>
  )
}

