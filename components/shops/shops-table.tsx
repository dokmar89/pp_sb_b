"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, Edit, Power, PowerOff, MoreHorizontal, ExternalLink } from "lucide-react"
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
import { ShopDetailsDialog } from "@/components/shops/shop-details-dialog"

interface ShopsTableProps {
  shops: {
    id: string
    name: string
    url: string
    status: string
    apiKey: string
    createdAt: string
    verifications: number
  }[]
}

export function ShopsTable({ shops }: ShopsTableProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedShop, setSelectedShop] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  async function handleStatusChange(id: string, newStatus: string) {
    setIsUpdating(id)
    
    try {
      const result = await updateShopStatus(id, newStatus)
      
      if (result.success) {
        toast.success(`Eshop byl ${newStatus === "active" ? "aktivován" : "deaktivován"}`)
        router.refresh()
      } else {
        toast.error(`Nepodařilo se změnit stav eshopu: ${result.error}`)
      }
    } catch (error) {
      toast.error("Došlo k neočekávané chybě")
    } finally {
      setIsUpdating(null)
    }
  }

  function showDetails(shopId: string) {
    setSelectedShop(shopId)
    setDetailsOpen(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Název</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vytvořeno</TableHead>
            <TableHead>Ověření</TableHead>
            <TableHead className="text-right">Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={shop.status === "active" ? "default" : "outline"}>
                    {shop.status === "active" ? "Aktivní" : "Neaktivní"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(shop.createdAt)}</TableCell>
                <TableCell>{shop.verifications}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => showDetails(shop.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <Link href={`/dashboard/shops/edit?shopId=${shop.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(
                            shop.id, 
                            shop.status === "active" ? "inactive" : "active"
                          )}
                          disabled={isUpdating === shop.id}
                        >
                          {shop.status === "active" ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deaktivovat
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Aktivovat
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {selectedShop && (
        <ShopDetailsDialog 
          shopId={selectedShop} 
          open={detailsOpen} 
          onOpenChange={setDetailsOpen} 
        />
      )}
    </>
  )
} 