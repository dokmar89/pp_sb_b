import type { Tables } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecentVerificationsProps {
  verifications: Tables<"verifications">[] | null
}

export function RecentVerifications({ verifications }: RecentVerificationsProps) {
  const getStatusIcon = (result: string | null) => {
    if (result === "success") {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    } else if (result === "failure") {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusText = (result: string | null) => {
    if (result === "success") {
      return "Schváleno"
    } else if (result === "failure") {
      return "Zamítnuto"
    } else {
      return "Čeká se"
    }
  }

  const getStatusClass = (result: string | null) => {
    if (result === "success") {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    } else if (result === "failure") {
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    } else {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Nedávná ověření</CardTitle>
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-1.5">
            <Search className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">ID ověření</TableHead>
                <TableHead>Metoda</TableHead>
                <TableHead>Čas</TableHead>
                <TableHead>Výsledek</TableHead>
                <TableHead className="text-right">Cena</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications?.map((verification) => (
                <TableRow key={verification.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{verification.id.slice(0, 8)}</TableCell>
                  <TableCell className="capitalize">{verification.method}</TableCell>
                  <TableCell>{new Date(verification.created_at).toLocaleString("cs", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                        getStatusClass(verification.result)
                      )}>
                        {getStatusIcon(verification.result)}
                        <span>{getStatusText(verification.result)}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {verification.price} Kč
                  </TableCell>
                </TableRow>
              ))}
              {!verifications?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-8 w-8 mb-2 opacity-20" />
                      <span>Žádná ověření k zobrazení</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
