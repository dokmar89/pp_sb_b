import type { Tables } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RecentVerificationsProps {
  verifications: Tables<"verifications">[] | null
}

export function RecentVerifications({ verifications }: RecentVerificationsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nedávná ověření</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID ověření</TableHead>
              <TableHead>Metoda</TableHead>
              <TableHead>Čas</TableHead>
              <TableHead>Výsledek</TableHead>
              <TableHead className="text-right">Cena</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications?.map((verification) => (
              <TableRow key={verification.id}>
                <TableCell className="font-medium">{verification.id.slice(0, 8)}</TableCell>
                <TableCell>{verification.method}</TableCell>
                <TableCell>{new Date(verification.created_at).toLocaleString("cs")}</TableCell>
                <TableCell>{verification.result === "success" ? "Schváleno" : "Zamítnuto"}</TableCell>
                <TableCell className="text-right">{verification.price} Kč</TableCell>
              </TableRow>
            ))}
            {!verifications?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Žádná ověření k zobrazení
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

