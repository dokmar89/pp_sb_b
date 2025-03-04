// lib/actions/wallet.ts
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const topUpSchema = z.object({
  companyId: z.string().uuid(),
  amount: z.number().positive(),
})
export async function createTopUpTransaction(formData: z.infer<typeof topUpSchema>) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    
    try {
        const transactionUuid = uuidv4(); // Generujeme UUID pro primární klíč
        // Nejprve ověříme, že společnost existuje
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id")
          .eq("id", formData.companyId)
          .single();

        if (companyError || !company) {
          throw new Error("Společnost nebyla nalezena");
        }
        // Vytvoříme transakci s UUID jako ID a číselným ID jako transaction_number
        const { data, error } = await supabase
          .from("wallet_transactions")
          .insert({
            id: transactionUuid, // UUID pro primární klíč
            company_id: company.id,
            type: "credit",
            amount: formData.amount,
            description: "Dobití kreditu",
            status: "pending",
          })
          .select()
          .single();

        if (error) {
          throw new Error("Došlo k chybě při vytváření transakce: " + error.message);
        }

        await revalidatePath("/dashboard");
        return { 
          success: true, 
          data: { 
            id: data.transaction_number, 
            companyId: company.id 
          } 
        };

    } catch (error: any) {
        console.error("Chyba při vytváření transakce:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Došlo k chybě při vytváření transakce"
        };
    }
}

// Funkce pro kontrolu stavu - zatím jen vrací co už je v DB.
export async function checkTopUpStatus(transactionId: string) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("status")
        .eq("transaction_number", transactionId) // Hledáme podle číselného ID
        .single();

      if (error) throw error;

      return { success: true, status: data.status };
    } catch (error) {
      console.error("Chyba při kontrole stavu transakce:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Došlo k chybě při kontrole stavu transakce" 
      };
    }
}