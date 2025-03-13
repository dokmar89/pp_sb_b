import { cookies } from "next/headers"
import { CustomizationForm } from "@/components/customization-form"
import { ShopSelect } from "@/components/shop-select"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

// ErrorBoundary musí být client komponenta
export const dynamic = "force-dynamic";
export default async function CustomizePage() {
  const supabase = createServerActionClient({ cookies })
  return (
    <div className="container py-8">
      <div>
        <h1 className="text-3xl font-bold">Přizpůsobení</h1>
        <p className="text-muted-foreground">Upravte vzhled a chování ověřovacího procesu</p>
      </div>
      <ShopSelect />
      <CustomizationForm />
    </div>
  )
}

