// app/dashboard/billing/billing-page-client.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { CheckAllPaymentsButton } from "@/components/check-all-payments-button";
import { Button } from "@/components/ui/button";
import { FileDown, Filter, Eye, CheckCircle, ArrowDown, ArrowUp } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
interface WalletTransaction {
    id: string;
    created_at: string;
    status: string;
    type: string;
    amount: number;
    transaction_number?: string;
}

interface BillingPageClientProps {
    initialInvoices: WalletTransaction[];
    pendingCount: number;
    paymentStatusOptions: { value: string; label: string }[];
    transactionTypeOptions: { value: string; label: string }[];
}

export const BillingPageClient: React.FC<BillingPageClientProps> = ({
    initialInvoices,
    pendingCount,
    paymentStatusOptions,
    transactionTypeOptions,
}) => {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [filteredInvoices, setFilteredInvoices] = useState(initialInvoices);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        applyFilters();
    }, [paymentStatusFilter, transactionTypeFilter, dateRange, invoices, sortColumn, sortDirection]);

    const applyFilters = () => {
        let filtered = [...invoices];

        if (dateRange?.from && dateRange?.to) {
            filtered = filtered.filter(invoice => {
                const invoiceDate = new Date(invoice.created_at);
                const fromDate = dateRange?.from ? new Date(dateRange.from) : undefined;
                const toDate = dateRange?.to ? new Date(dateRange.to) : undefined;
                return invoiceDate >= (fromDate || new Date()) && invoiceDate <= (toDate || new Date());
            });
        }

        if (paymentStatusFilter !== "all") {
            filtered = filtered.filter(invoice => invoice.status === paymentStatusFilter);
        }

        if (transactionTypeFilter !== "all") {
            filtered = filtered.filter(invoice => invoice.type === transactionTypeFilter);
        }

        // Apply sorting
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortColumn as keyof WalletTransaction];
                const bValue = b[sortColumn as keyof WalletTransaction];

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredInvoices(filtered);
    };

    const exportToCSV = () => {
        if (filteredInvoices.length === 0) {
            alert("Žádná data k exportu.");
            return;
        }

        const csvRows = [];
        const headers = ["id", "created_at", "status", "type", "amount"];
        csvRows.push(headers.join(','));

        for (const invoice of filteredInvoices) {
            const values = headers.map(header => {
                let value = invoice[header];
                if (header === "created_at") {
                    value = format(new Date(value), 'yyyy-MM-dd');
                }
                return `"${value || ''}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fakturace.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewInvoice = (invoiceId: string) => {
        window.open(`/api/invoice/view/${invoiceId}`, '_blank');
    };

    const handleDownloadInvoice = (invoiceId: string) => {
        window.location.href = `/api/invoice/${invoiceId}`;
    };

    const handleVerifyPayment = async (transactionNumber: string) => {
        try {
            const response = await fetch('/api/check-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactionNumber }),
            });

            const data = await response.json();

            if (data.status === 'completed') {
                toast.success('Platba byla úspěšně přijata!');
                setInvoices(prevInvoices => {
                    return prevInvoices.map(inv => {
                        if (inv.transaction_number === transactionNumber) {
                            return { ...inv, status: 'completed' };
                        }
                        return inv;
                    });
                });
                setFilteredInvoices(prevFilteredInvoices => {
                    return prevFilteredInvoices.map(inv => {
                        if (inv.transaction_number === transactionNumber) {
                            return { ...inv, status: 'completed' };
                        }
                        return inv;
                    });
                });
            } else {
                toast.info('Platba zatím nebyla přijata. Zkuste to prosím později.');
            }
        } catch (error) {
            toast.error('Chyba při kontrole platby');
        }
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (column: string) => {
        if (sortColumn === column) {
            return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
        }
        return null;
    };

    return (
        <div className="container py-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Historie transakcí</h1>
                    <p className="text-muted-foreground mt-1">
                        Přehled všech transakcí a plateb
                    </p>
                </div>

                {pendingCount > 0 && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Čekající platby: {pendingCount}
                        </span>
                        <CheckAllPaymentsButton />
                    </div>
                )}
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <DateRangePicker onDateChange={setDateRange} />

                        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status platby" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentStatusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Typ transakce" />
                            </SelectTrigger>
                            <SelectContent>
                                {transactionTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={applyFilters}>
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-end mb-4">
                        <Button variant="default" className="bg-primary text-white hover:bg-primary/90" onClick={exportToCSV}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('created_at')}>
                                        Datum {getSortIcon('created_at')}
                                    </th>
                                    <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('description')}>
                                        Popis {getSortIcon('description')}
                                    </th>
                                    <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('amount')}>
                                        Částka {getSortIcon('amount')}
                                    </th>
                                    <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('status')}>
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th className="py-2 px-4 text-right">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                                        <td className="py-2 px-4">{format(new Date(invoice.created_at), 'dd.MM.yyyy')}</td>
                                        <td className="py-2 px-4">{invoice.description}</td>
                                        <td className="py-2 px-4" style={{ color: invoice.type === 'credit' ? 'green' : 'red' }}>
                                            {invoice.type === 'credit' ? '+' : '-'} {invoice.amount} Kč
                                        </td>
                                        <td className="py-2 px-4">
                                            <Badge variant={
                                                invoice.status === "completed" ? "default" : "secondary"
                                            }>
                                                {invoice.status === "completed" ? "Dokončeno" : "Zpracovává se"}
                                            </Badge>
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {invoice.status === 'pending' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleVerifyPayment(invoice.transaction_number)}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Zkontrolovat
                                                    </Button>
                                                )}
                                                {invoice.status === 'completed' && (
                                                    <>
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                                                            <Eye className="h-4 w-4 mr-2" /> Zobrazit
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice.id)}>
                                                            <FileDown className="h-4 w-4 mr-2" /> Stáhnout
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-4 px-4 text-center">Žádné faktury nenalezeny.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};