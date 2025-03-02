// components/shops-list.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Tables } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShopDetailDialog } from "@/components/shops/shop-detail-dialog"
import { Eye, Power, Trash } from "lucide-react"
import { toast } from "react-hot-toast"

export function ShopsList() {
    const [shops, setShops] = useState<Tables<"shops">[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
    const supabase = createClientComponentClient()

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: company } = await supabase
                    .from("companies")
                    .select("id")
                    .eq("user_id", user.id)
                    .single()

                if (!company) return

                const { data: shops } = await supabase
                    .from("shops")
                    .select("*, verifications:verifications(count)")
                    .eq("company_id", company.id)
                    .order("created_at", { ascending: false })

                if (shops) {
                    setShops(shops)
                }
            } catch (error) {
                console.error("Error fetching shops:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchShops()
    }, [supabase])

    const handleStatusToggle = async (shopId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        const result = await updateShopStatus(shopId, newStatus)
        if (result.success) {
            toast.success(`Status eshopu byl změněn na ${newStatus}`)
            // Refresh dat
            fetchShops()
        } else {
            toast.error(result.error || "Nepodařilo se změnit status")
        }
    }

    const handleDelete = async (shopId: string) => {
        if (confirm("Opravdu chcete smazat tento eshop? Tato akce je nevratná.")) {
            try {
                const { error } = await supabase
                    .from('shops')
                    .delete()
                    .eq('id', shopId)
                
                if (error) throw error
                toast.success("Eshop byl úspěšně smazán")
                fetchShops()
            } catch (error) {
                toast.error("Nepodařilo se smazat eshop")
            }
        }
    }

    if (isLoading) {
        return <div>Načítání...</div>
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Název</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>API Klíč</TableHead>
                            <TableHead>Verifikace</TableHead>
                            <TableHead className="w-[200px]">Akce</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shops.map((shop) => (
                            <TableRow key={shop.id}>
                                <TableCell>{shop.name}</TableCell>
                                <TableCell>{shop.url}</TableCell>
                                <TableCell>
                                    <Badge variant={shop.status === 'active' ? 'success' : 'destructive'}>
                                        {shop.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <code className="rounded bg-muted px-2 py-1">{shop.api_key}</code>
                                </TableCell>
                                <TableCell>{(shop.verifications as any)?.count || 0}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedShopId(shop.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Detail
                                        </Button>
                                        <Button
                                            variant={shop.status === 'active' ? 'default' : 'secondary'}
                                            size="sm"
                                            onClick={() => handleStatusToggle(shop.id, shop.status)}
                                        >
                                            <Power className="h-4 w-4 mr-1" />
                                            {shop.status === 'active' ? 'Deaktivovat' : 'Aktivovat'}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(shop.id)}
                                        >
                                            <Trash className="h-4 w-4 mr-1" />
                                            Smazat
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedShopId && (
                <ShopDetailDialog
                    shopId={selectedShopId}
                    isOpen={!!selectedShopId}
                    onClose={() => setSelectedShopId(null)}
                />
            )}
        </>
    )
}