"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createQrPaymentSvg } from '@tedyno/cz-qr-payment'
import { toast } from "sonner"
import { createTopUpTransaction } from "@/lib/actions/wallet"

interface PaymentOptions {
  VS: string;
  message?: string;
}

const AMOUNTS = [
  { value: "500", label: "500 Kč" },
  { value: "1000", label: "1 000 Kč" },
  { value: "2000", label: "2 000 Kč" },
  { value: "5000", label: "5 000 Kč" },
]

interface TopUpWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
}

export function TopUpWalletDialog({ open, onOpenChange, companyId }: TopUpWalletDialogProps) {
  const [amount, setAmount] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showQR && transactionId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/transaction/status/${transactionId}`);
          const data = await response.json();
          
          if (data.status === 'completed') {
            clearInterval(interval);
            toast.success('Platba byla úspěšně přijata!');
            handleClose();
          }
        } catch (error) {
          console.error('Chyba při kontrole stavu:', error);
        }
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showQR, transactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) {
      toast.error("Vyberte nebo zadejte částku.");
      return;
    }

    try {
      const result = await createTopUpTransaction({
        companyId,
        amount: Number(amount),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Neznámá chyba");
      }

      const transId = result.data.id;
      setTransactionId(transId);

      // Vygenerování QR platby
      const qrPaymentSvg = createQrPaymentSvg(
        Number(amount),
        '2702945534/2010',
        {
          VS: transId,
          message: `Dobiti kreditu - ${transId}`
        } as PaymentOptions
      );
      setQrCodeSvg(qrPaymentSvg);
      setShowQR(true);

    } catch (error: any) {
      console.error("Chyba při vytváření transakce:", error);
      toast.error(error.message || "Došlo k chybě při vytváření transakce");
    }
  }

  const handleCheckStatus = async () => {
    if (!transactionId) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/transaction/status/${transactionId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        toast.success('Platba byla úspěšně přijata!');
        handleClose();
      } else {
        toast.info('Platba zatím nebyla přijata. Zkuste to prosím později.');
      }
    } catch (error: any) {
      toast.error('Chyba při kontrole platby: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  }

  const handleClose = () => {
    setShowQR(false)
    setTransactionId(null)
    setAmount("")
    setQrCodeSvg(null)
    onOpenChange(false)
  }

  if (showQR) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Platební údaje</DialogTitle>
            <DialogDescription>Naskenujte QR kód nebo použijte platební údaje níže</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="mx-auto w-48">
              {qrCodeSvg && (
                <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
              )}
            </div>
            <div className="grid gap-2 text-sm">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Číslo účtu:</span>
                <span className="font-medium">2702945534/2010</span>  {/*  Zde dejte *svoje* číslo účtu a kód banky */}
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Variabilní symbol:</span>
                {/* Používáme transactionId pro zobrazení VS */}
                <span className="font-medium">{transactionId?.slice(0, 10)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Částka:</span>
                <span className="font-medium">{amount} Kč</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCheckStatus} disabled={isChecking} className="flex-1">
                {isChecking ? "Kontroluji..." : "Zkontrolovat platbu"}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Zavřít
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dobít kredit</DialogTitle>
          <DialogDescription>Vyberte částku nebo zadejte vlastní hodnotu</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup value={amount} onValueChange={setAmount} className="grid grid-cols-2 gap-4">
            {AMOUNTS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                <Label
                  htmlFor={option.value}
                  className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="custom">Vlastní částka</Label>
            <Input
              id="custom"
              type="number"
              placeholder="Zadejte částku v Kč"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!amount}>
              Pokračovat k platbě
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
          </div>
        </form>
        {amount && (
          <div className="rounded-md bg-muted p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span>Částka k úhradě:</span>
              <span className="text-right font-medium">{Number(amount).toFixed(2)} Kč</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}