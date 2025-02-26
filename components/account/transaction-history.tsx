"use client"

import { useEffect, useState, useRef } from "react" // Added useRef for debugging
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface TransactionHistoryProps {
    companyId: string
}

export function TransactionHistory({ companyId }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Tables<"wallet_transactions">[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast: useToastHook } = useToast();
    const isInitialLoad = useRef(true); // useRef to track initial load

    useEffect(() => {
        console.log("TransactionHistory useEffect hook is running. companyId:", companyId); // LOG 1: Effect start

        if (!companyId) {
            console.warn("companyId prop is missing or empty. Transactions will not be fetched."); // LOG 2: Missing companyId
            setIsLoading(false);
            return;
        }

        const fetchTransactions = async () => {
            console.log("fetchTransactions function is called. companyId:", companyId); // LOG 3: fetchTransactions start
            setIsLoading(true);
            try {
                console.log("Supabase query: fetching wallet_transactions for companyId:", companyId); // LOG 4: Supabase query start
                const { data, error } = await supabase
                    .from("wallet_transactions")
                    .select("*")
                    .eq("company_id", companyId)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching transactions:", error); // LOG 5: Supabase query error
                    useToastHook({
                        title: "Chyba při načítání historie transakcí",
                        description: error.message,
                        variant: "destructive",
                    });
                    return;
                }

                console.log("Supabase query successful. Data received:", data); // LOG 6: Supabase query success
                setTransactions(data || []);
                console.log("setTransactions called with data:", data); // LOG 7: setTransactions called

            } catch (error) {
                console.error("Unexpected error fetching transactions:", error); // LOG 8: Unexpected error
                useToastHook({
                    title: "Neočekávaná chyba",
                    description: "Došlo k neočekávané chybě při načítání transakcí.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
                console.log("setIsLoading(false) in finally block"); // LOG 9: setIsLoading(false)
            }
        };

        fetchTransactions();

        const channel = supabase
            .channel(`transactions_changes_company_${companyId}`) // More specific channel name
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "wallet_transactions",
                    filter: `company_id=eq.${companyId}`,
                },
                (payload) => {
                    console.log("Realtime event received:", payload); // LOG 10: Realtime event
                    if (payload.eventType === "INSERT") {
                        setTransactions((current) => [payload.new as Tables<"wallet_transactions">, ...current]);
                        console.log("Realtime INSERT event - transactions updated:", [payload.new as Tables<"wallet_transactions">, ...transactions]); // LOG 11: Realtime INSERT
                    } else if (payload.eventType === "UPDATE") {
                        setTransactions((current) =>
                            current.map((transaction) => (transaction.id === payload.new.id ? (payload.new as Tables<"wallet_transactions">) : transaction))
                        );
                        console.log("Realtime UPDATE event - transactions updated"); // LOG 12: Realtime UPDATE
                    } else if (payload.eventType === "DELETE") {
                        setTransactions((current) => current.filter((transaction) => transaction.id !== payload.old.id));
                        console.log("Realtime DELETE event - transactions updated"); // LOG 13: Realtime DELETE
                    }
                }
            )
            .subscribe()

        console.log("Realtime channel subscribed for companyId:", companyId); // LOG 14: Channel subscribed

        return () => {
            channel.unsubscribe();
            console.log("Realtime channel unsubscribed for companyId:", companyId); // LOG 15: Channel unsubscribed
        };
    }, [companyId, useToastHook]);

    const formatAmount = (amount: number, type: string) => `${type === "credit" ? "+" : "-"}${amount.toFixed(2)} Kč`;

    const handleDownloadInvoice = async (transactionId: string, invoiceNumber: string) => {
        try {
            const response = await fetch(`/api/invoice/${transactionId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || `Chyba při stahování faktury: ${response.statusText}`);
            }
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faktura-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error("Error downloading invoice:", error);
            useToastHook({
                title: "Chyba při stahování faktury",
                description: error.message || "Nepodařilo se stáhnout fakturu.",
                variant: "destructive",
            });
        }
    };

    console.log("Component rendering - isLoading:", isLoading, "transactions.length:", transactions.length); // LOG 16: Component render

    if (isLoading) {
        console.log("Loading state - rendering skeleton UI"); // LOG 17: Loading UI
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historie transakcí</CardTitle>
                    <CardDescription>Přehled všech transakcí na účtu</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Historie transakcí</CardTitle>
                    <CardDescription>Přehled všech transakcí na účtu</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Popis</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Částka</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        Žádné transakce k zobrazení
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((transaction) => {
                                    console.log("Rendering transaction:", transaction.id); // LOG 18: Rendering transaction
                                    return (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                {format(new Date(transaction.created_at), "Pp", {
                                                    locale: cs,
                                                })}
                                            </TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell>
                                                {transaction.status === "completed"
                                                    ? "Dokončeno"
                                                    : transaction.status === "pending"
                                                        ? "Čeká na zpracování"
                                                        : "Zamítnuto"}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                                            >
                                                {formatAmount(transaction.amount, transaction.type)}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.type === "credit" &&
                                                    transaction.status === "completed" &&
                                                    transaction.invoice_number && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDownloadInvoice(transaction.id, transaction.invoice_number!)}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Stáhnout fakturu {transaction.invoice_number}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}