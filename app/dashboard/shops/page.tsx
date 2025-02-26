// app/dashboard/shops/page.tsx
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { AddShopDialog } from "@/components/add-shop-dialog"
import { ShopsList } from "@/components/shops-list"

export default async function ShopsPage() {
    console.log("ShopsPage component rendering"); // LOG 1: Component render start

    const supabase = createServerComponentClient({ cookies });
    console.log("createServerComponentClient initialized"); // LOG 2: Supabase client initialized

    try {
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();
        console.log("getSession() called"); // LOG 3: getSession() called

        if (sessionError) {
            console.error("Error getting session:", sessionError); // LOG 4: Session error
            console.log("Redirecting to login due to session error"); // LOG 5: Redirect due to session error
            redirect("/auth/login");
        }

        if (!session) {
            console.warn("No session found"); // LOG 6: No session
            console.log("Redirecting to login due to no session"); // LOG 7: Redirect due to no session
            redirect("/auth/login");
        }

        console.log("Session data:", session); // LOG 8: Session data - SUCCESS
        console.log("User is authenticated, rendering ShopsPage content"); // LOG 9: Rendering ShopsPage content

        // Nově získáme companyId
        const { data: company, error: companyError } = await supabase
            .from("companies")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

        if (companyError) {
            console.error("Error fetching company:", companyError);
            redirect("/auth/login"); // Pokud se nepodaří získat company, přesměrujeme na login
        }

        const companyId = company?.id;

        if (!companyId) {
          console.error("Company ID is null");
          redirect("/auth/login"); // Pokud je companyId null, přesměrujeme na login
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Eshopy</h1>
                        <p className="text-muted-foreground">Správa vašich eshopů a jejich API klíčů</p>
                    </div>
                    <AddShopDialog />
                </div>
                <ShopsList companyId={companyId} />
            </div>
        );
    } catch (error) {
        console.error("Unexpected error in ShopsPage:", error); // LOG 10: Unexpected error
        console.log("Redirecting to login due to unexpected error"); // LOG 11: Redirect due to unexpected error
        redirect("/auth/login");
        return null; // Add explicit return null to satisfy type checker
    }
}