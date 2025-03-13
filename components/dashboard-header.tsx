import type { Tables } from "@/lib/supabase/types"

interface DashboardHeaderProps {
  company: Tables<"companies">
}

export function DashboardHeader({ company }: DashboardHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Vítejte, {company.name}</p>
    </div>
  )
}

