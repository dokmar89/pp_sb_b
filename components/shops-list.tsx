// components/shops-list.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Tables } from "@/lib/supabase/types"
import { ShopsTable } from "@/components/shops/shops-table"
import { toast } from "sonner"

interface ShopData {
  id: string
  name: string
  url: string
  status: string
  apiKey: string
  createdAt: string
  verifications: number
}

interface ShopsListProps {
  companyId: string;
}

export function ShopsList({ companyId }: ShopsListProps) {
    const [shops, setShops] = useState<ShopData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClientComponentClient()

    useEffect(() => {
        if (!companyId) {
            console.warn("companyId prop is missing or empty. Shops will not be fetched.");
            setIsLoading(false);
            return;
        }

        const fetchShops = async () => {
            setIsLoading(true);
            try {
                const { data: shops, error } = await supabase
                    .from("shops")
                    .select("*, verifications:verifications(count)")
                    .eq("company_id", companyId)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching shops:", error);
                    toast.error("Nepodařilo se načíst eshopy");
                    return;
                }
                
                const formattedShops: ShopData[] = shops?.map(shop => ({
                    id: shop.id,
                    name: shop.name,
                    url: shop.url,
                    status: shop.status,
                    apiKey: shop.api_key,
                    createdAt: shop.created_at,
                    verifications: shop.verifications?.count || 0
                })) || []
                
                setShops(formattedShops)
            } catch (error) {
                console.error("Error fetching shops:", error);
                toast.error("Došlo k neočekávané chybě při načítání eshopů");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShops();

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
                () => fetchShops()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [companyId, supabase]);

    if (isLoading) {
        return (
            <div className="rounded-md border">
                <div className="p-8 text-center">
                    <div className="h-6 w-24 animate-pulse rounded bg-muted mx-auto"></div>
                </div>
            </div>
        );
    }

    return <ShopsTable shops={shops} />;
}