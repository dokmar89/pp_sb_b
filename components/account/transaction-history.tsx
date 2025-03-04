"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Eye } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { CheckPaymentButton } from "@/components/check-payment-button"
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  description: string
  amount: number
  type: "credit" | "debit"
  status: "completed" | "pending" | "failed"
  created_at: string
  invoice_url?: string
  invoice_number?: string
  company_id: string
}

interface TransactionHistoryProps {
  companyId: string
}

export function TransactionHistory({ companyId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    loadTransactions()
  }, [companyId])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      
     
      setTransactions(data?.length ? data : mockData)
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast.error("Nepodařilo se načíst transakce")
    } finally {
      setIsLoading(false)
    }
  }

  const viewInvoice = async (transactionId: string) => {
    try {
      setIsViewing(transactionId)
      
      // Otevřeme nové okno s URL na správný endpoint pro zobrazení faktury
      window.open(`/api/invoice/view/${transactionId}`, '_blank')
      
      toast.success("Faktura byla otevřena v novém okně")
    } catch (error) {
      console.error("Error viewing invoice:", error)
      toast.error("Nepodařilo se zobrazit fakturu")
    } finally {
      setIsViewing(null)
    }
  }

  const downloadInvoice = async (transactionId: string) => {
    try {
      setIsDownloading(transactionId)
      
      // Použijeme správný endpoint pro stažení faktury
      const response = await fetch(`/api/invoice/${transactionId}`)
      
      if (!response.ok) {
        throw new Error(`Chyba při stahování faktury: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `faktura-${transactionId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Faktura byla stažena")
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Nepodařilo se stáhnout fakturu")
    } finally {
      setIsDownloading(null)
    }
  }

  return (
    <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead>Částka</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={
                    transaction.type === "credit" 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  }>
                    {transaction.type === "credit" ? "+" : "-"}{transaction.amount} Kč
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        transaction.status === "completed" 
                          ? "default"
                          : transaction.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {transaction.status === "completed" 
                        ? "Dokončeno" 
                        : transaction.status === "pending"
                        ? "Zpracovává se"
                        : "Selhalo"
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.status === "completed" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewInvoice(transaction.id)}
                          disabled={isViewing === transaction.id}
                        >
                          {isViewing === transaction.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          Zobrazit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(transaction.id)}
                          disabled={isDownloading === transaction.id}
                        >
                          {isDownloading === transaction.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Stáhnout
                        </Button>
                      </div>
                    )}
                    {transaction.status === "pending" && (
                      <TableCell>
                        <CheckPaymentButton 
                          transactionNumber={transaction.transaction_number}
                          onPaymentConfirmed={() => {
                            router.refresh()
                          }}
                        />
                      </TableCell>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Zatím zde nejsou žádné transakce
          </div>
        )}
    </Card>
  )
}