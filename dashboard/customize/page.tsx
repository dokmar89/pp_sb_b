import { CustomizationForm } from "@/components/customization-form"
import { ShopSelect } from "@/components/shop-select"

// ErrorBoundary musí být client komponenta
export default function CustomizePage() {
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

