// app/dashboard/shops/page.tsx
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { AddShopDialog } from "@/components/add-shop-dialog"
import { ShopsList } from "@/components/shops-list"

export default async function ShopsPage() {
    console.log("ShopsPage component rendering")
    const supabase = createServerComponentClient({ cookies })
    console.log("createServerComponentClient initialized")

    try {
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()
        console.log("getSession() called")

        if (sessionError || !session) {
            console.log("Redirecting to login due to session error or no session")
            redirect("/auth/login")
        }

        // Získáme companyId
        const { data: company, error: companyError } = await supabase
            .from("companies")
            .select("id")
            .eq("user_id", session.user.id)
            .single()

        if (companyError || !company?.id) {
            console.error("Error fetching company:", companyError)
            redirect("/auth/login")
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Eshopy</h1>
                        <p className="text-muted-foreground">
                            Správa vašich eshopů a jejich API klíčů
                        </p>
                    </div>
                    <AddShopDialog companyId={company.id} />
                </div>
                <ShopsList companyId={company.id} />
            </div>
        )
    } catch (error) {
        console.error("Error in ShopsPage:", error)
        return <div>Došlo k chybě při načítání dat</div>
    }
}