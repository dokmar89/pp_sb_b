"use client"

import type React from "react"
import { useState } from "react"
import { QrCode } from "lucide-react"
import { toast } from "sonner"

import { createTopUpTransaction, checkTopUpStatus } from "@/lib/actions/wallet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
  const [isChecking, setIsChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createTopUpTransaction({
        companyId,
        amount: Number(amount),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setTransactionId(result.data.id)
      setShowQR(true)
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast.error("Došlo k chybě při vytváření transakce")
    }
  }

  const handleCheckStatus = async () => {
    if (!transactionId) return

    try {
      setIsChecking(true)
      const result = await checkTopUpStatus(transactionId)

      if (!result.success) {
        throw new Error(result.error)
      }

      if (result.status === "completed") {
        toast.success("Platba byla úspěšně připsána")
        onOpenChange(false)
      } else if (result.status === "pending") {
        toast.info("Platba zatím nebyla připsána")
      } else {
        toast.error("Platba se nezdařila")
      }
    } catch (error) {
      console.error("Error checking status:", error)
      toast.error("Došlo k chybě při kontrole stavu platby")
    } finally {
      setIsChecking(false)
    }
  }

  const handleClose = () => {
    setShowQR(false)
    setTransactionId(null)
    setAmount("")
    onOpenChange(false)
  }

  const finalAmount = Number(amount) * 1.21 // Add 21% VAT

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
              <QrCode className="h-48 w-48" />
            </div>
            <div className="grid gap-2 text-sm">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Číslo účtu:</span>
                <span className="font-medium">123456789/0100</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Variabilní symbol:</span>
                <span className="font-medium">{transactionId?.slice(0, 10)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Částka:</span>
                <span className="font-medium">{finalAmount.toFixed(2)} Kč</span>
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
          {amount && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span>Částka bez DPH:</span>
                <span className="text-right">{Number(amount).toFixed(2)} Kč</span>
                <span>DPH 21%:</span>
                <span className="text-right">{(Number(amount) * 0.21).toFixed(2)} Kč</span>
                <span className="font-medium">Celkem:</span>
                <span className="text-right font-medium">{finalAmount.toFixed(2)} Kč</span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!amount}>
              Pokračovat k platbě
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

