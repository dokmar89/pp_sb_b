// components/shops-list.tsx
"use client"

import { useEffect, useState } from "react"
import { Copy, MoreVertical, Store } from 'lucide-react'
import { toast } from "sonner"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Tables } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast" // Import useToast hook

export function ShopsList() {
    const [shops, setShops] = useState<Tables<"shops">[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const supabase = createClientComponentClient()
    const { toast: useToastHook } = useToast() // Use the useToast hook

    // První useEffect pro získání company_id
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: company } = await supabase
                    .from("companies")
                    .select("id")
                    .eq("user_id", user.id)
                    .single()

                if (company) {
                    setCompanyId(company.id)
                }
            } catch (error) {
                console.error("Error fetching company:", error)
            }
        }

        fetchCompanyId()
    }, [])

    // Druhý useEffect pro načtení shopů, závislý na companyId
    useEffect(() => {
        if (!companyId) return

        const fetchShops = async () => {
            try {
                const { data: shops, error } = await supabase
                    .from("shops")
                    .select("*")
                    .eq("company_id", companyId)
                    .order("created_at", { ascending: false })

                if (error) throw error
                setShops(shops || [])
            } catch (error) {
                console.error("Error fetching shops:", error)
                toast.error("Nepodařilo se načíst seznam eshopů")
            } finally {
                setIsLoading(false)
            }
        }

        fetchShops()

        // Realtime subscription
        const channel = supabase
            .channel("shops_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "shops",
                    filter: `company_id=eq.${companyId}`
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setShops((current) => [payload.new as Tables<"shops">, ...current])
                    } else if (payload.eventType === "DELETE") {
                        setShops((current) => current.filter((shop) => shop.id !== payload.old.id))
                    } else if (payload.eventType === "UPDATE") {
                        setShops((current) =>
                            current.map((shop) => (shop.id === payload.new.id ? (payload.new as Tables<"shops">) : shop))
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [companyId])

    const copyApiKey = (apiKey: string) => {
        navigator.clipboard.writeText(apiKey)
        toast.success("API klíč byl zkopírován do schránky")
    }

    const handleStatusChange = async (shopId: string, newStatus: "active" | "inactive") => {
        try {
            const result = await updateShopStatus(shopId, newStatus)
            if (!result.success) {
                throw new Error(result.error)
            }
            toast.success(`Status eshopu byl změněn na ${newStatus === "active" ? "aktivní" : "neaktivní"}`)
        } catch (error) {
            console.error("Error updating shop status:", error)
            toast.error("Nepodařilo se změnit status eshopu")
        }
    }

    console.log("ShopsList component rendering - isLoading:", isLoading, "shops.length:", shops.length); // LOG 11: ShopsList render

    if (isLoading) {
        console.log("ShopsList - Loading state - rendering skeleton UI"); // LOG 12: ShopsList loading UI
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Název</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>API klíč</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3].map((i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="h-6 w-24 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                    <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                    <div className="h-6 w-40 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                    <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                    <div className="h-6 w-8 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>API klíč</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shops.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                Zatím nemáte žádné eshopy
                            </TableCell>
                        </TableRow>
                    ) : (
                        shops.map((shop) => (
                            <TableRow key={shop.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4" />
                                        {shop.name}
                                    </div>
                                </TableCell>
                                <TableCell>{shop.url}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <code className="rounded bg-muted px-2 py-1">{shop.api_key}</code>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyApiKey(shop.api_key)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>{shop.status === "active" ? "Aktivní" : "Neaktivní"}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {shop.status === "active" ? (
                                                <DropdownMenuItem onClick={() => handleStatusChange(shop.id, "inactive")}>
                                                    Deaktivovat
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleStatusChange(shop.id, "active")}>Aktivovat</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}