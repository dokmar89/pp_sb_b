import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { WidgetVerification } from "@/components/widget/widget-verification"

interface WidgetPageProps {
  searchParams: {
    apiKey: string
    mode?: "modal" | "inline"
  }
}

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const { apiKey, mode = "modal" } = searchParams

  if (!apiKey) {
    return <div className="p-4 text-red-500">Chybí API klíč</div>
  }

  const supabase = createServerComponentClient({ cookies })

  // Fetch shop and customization data
  const { data: shop } = await supabase
    .from("shops")
    .select(`
      *,
      customizations (*)
    `)
    .eq("api_key", apiKey)
    .single()

  if (!shop) {
    return <div className="p-4 text-red-500">Neplatný API klíč</div>
  }

  if (shop.status !== "active") {
    return <div className="p-4 text-red-500">Eshop není aktivní</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <WidgetVerification shopId={shop.id} apiKey={apiKey} mode={mode} customization={shop.customizations} />
    </div>
  )
}

