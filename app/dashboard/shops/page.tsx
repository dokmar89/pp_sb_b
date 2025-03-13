// app/dashboard/shops/page.tsx
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { AddShopDialog } from "@/components/add-shop-dialog"
import { ShopsList } from "@/components/shops-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic";
export default async function ShopsPage() {
    const supabase = createServerComponentClient({ cookies })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Získáme companyId
    const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

    if (!company?.id) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">Účet nenalezen</h2>
                    <p className="text-muted-foreground">Nemáte přístup k firemnímu účtu</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">E-shopy</h1>
                    <p className="text-muted-foreground mt-1">
                        Správa vašich e-shopů
                    </p>
                </div>
                <AddShopDialog companyId={company.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Seznam e-shopů</CardTitle>
                    <CardDescription>
                        Přehled všech vašich připojených e-shopů
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ShopsList companyId={company.id} />
                </CardContent>
            </Card>
        </div>
    )
}