import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { EditShopForm } from "@/components/shops/edit-shop-form"

export const dynamic = "force-dynamic";
export default async function EditShopPage({
  searchParams,
}: {
  searchParams: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const shopId = searchParams.id

  if (!shopId) {
    redirect("/dashboard/shops")
  }

  const { data: shop, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single()

  if (error || !shop) {
    redirect("/dashboard/shops")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upravit eshop</h1>
        <p className="text-muted-foreground">
          Upravte nastavení vašeho eshopu
        </p>
      </div>
      <EditShopForm shop={shop} />
    </div>
  )
} 