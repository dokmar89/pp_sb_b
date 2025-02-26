"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ShopSelect() {
  const [shops, setShops] = useState<Tables<"shops">[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedShopId = searchParams.get("shopId")

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data: shops, error } = await supabase.from("shops").select("*").eq("status", "active").order("name")

        if (error) throw error
        setShops(shops || [])

        // If no shop is selected and we have shops, select the first one
        if (!selectedShopId && shops && shops.length > 0) {
          router.push(`/dashboard/customize?shopId=${shops[0].id}`)
        }
      } catch (error) {
        console.error("Error fetching shops:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShops()
  }, [selectedShopId, router])

  const handleShopChange = (shopId: string) => {
    router.push(`/dashboard/customize?shopId=${shopId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-xs">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
      </div>
    )
  }

  if (shops.length === 0) {
    return <div className="text-sm text-muted-foreground">Nejsou k dispozici žádné aktivní eshopy</div>
  }

  return (
    <div className="max-w-xs">
      <Select value={selectedShopId || undefined} onValueChange={handleShopChange}>
        <SelectTrigger>
          <SelectValue placeholder="Vyberte eshop" />
        </SelectTrigger>
        <SelectContent>
          {shops.map((shop) => (
            <SelectItem key={shop.id} value={shop.id}>
              {shop.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

