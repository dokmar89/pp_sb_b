// components/shops/shops-table.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, Edit, Power, PowerOff, MoreHorizontal, ExternalLink, Copy, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { updateShopStatus } from "@/lib/actions/shops"
import { ShopDetailsDialog } from "@/components/shops/shop-detail-dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { ShopAnalyticsDialog } from "@/components/shops/shop-analytics-dialog"

interface ShopData {
  id: string
  name: string
  url: string
  status: string
  apiKey: string
  createdAt: string
  verifications: number
}

interface ShopsTableProps {
  shops: ShopData[]
}

export function ShopsTable({ shops: initialShops }: ShopsTableProps) {
  const router = useRouter()
  const [shops, setShops] = useState<ShopData[]>(initialShops)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedShop, setSelectedShop] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)

  const handleStatusChange = async (shopId: string, newStatus: "active" | "inactive") => {
    try {
      setIsUpdating(shopId)
      console.log("Changing status to:", newStatus)
      
      const result = await updateShopStatus(shopId, newStatus)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Aktualizujeme lokální stav
      setShops(currentShops => 
        currentShops.map(shop => 
          shop.id === shopId 
            ? { ...shop, status: newStatus }
            : shop
        )
      )

      toast.success(`Eshop byl ${newStatus === "active" ? "aktivován" : "deaktivován"}`)
    } catch (error) {
      console.error("Error updating shop status:", error)
      toast.error("Nepodařilo se změnit status eshopu")
    } finally {
      setIsUpdating(null)
    }
  }

  const showDetails = (shopId: string) => {
    setSelectedShop(shopId)
    setDetailsOpen(true)
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast.success("API klíč zkopírován")
  }

  const showAnalytics = (shopId: string) => {
    setSelectedShopId(shopId)
    setAnalyticsOpen(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Název</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>API Klíč</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vytvořeno</TableHead>
            <TableHead>Ověření</TableHead>
            <TableHead className="text-right">Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Zatím nemáte žádné eshopy
              </TableCell>
            </TableRow>
          ) : (
            shops.map((shop) => (
              <TableRow key={shop.id}>
                <TableCell className="font-medium">{shop.name}</TableCell>
                <TableCell>
                  <a
                    href={shop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    {shop.url.replace(/^https?:\/\//, '')}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-sm">
                      {shop.apiKey}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyApiKey(shop.apiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={shop.status === "active" ? "default" : "secondary"}>
                    {shop.status === "active" ? "Aktivní" : "Neaktivní"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(shop.createdAt)}</TableCell>
                <TableCell>{shop.verifications}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => showDetails(shop.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStatusChange(
                        shop.id,
                        shop.status === "active" ? "inactive" : "active"
                      )}
                      disabled={isUpdating === shop.id}
                    >
                      {isUpdating === shop.id ? (
                        <span className="animate-spin">...</span>
                      ) : shop.status === "active" ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => showAnalytics(shop.id)}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ShopDetailsDialog shopId={selectedShop || ""} open={detailsOpen} onOpenChange={setDetailsOpen} />
      <ShopAnalyticsDialog 
        shopId={selectedShopId || ""} 
        open={analyticsOpen} 
        onOpenChange={setAnalyticsOpen}
      />
    </>
  )
}