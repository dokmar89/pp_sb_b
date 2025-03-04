// pages/api/transaction-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase/server"; // Váš serverový Supabase klient

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { transactionId } = req.query;
  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ error: "Missing transactionId" });
  }

  const { data, error } = await supabaseAdmin
    .from("wallet_transactions")
    .select("status")
    .eq("id", transactionId)
    .single();

  if (error) {
    return res.status(500).json({ error: "Error retrieving transaction" });
  }

  return res.status(200).json({ status: data.status });
}
