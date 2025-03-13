"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopUpWalletDialog } from "@/components/top-up-wallet-dialog"

interface WalletBalanceProps {
  balance: number
  companyId: string
}

export function WalletBalance({ balance, companyId }: WalletBalanceProps) {
  const [showTopUp, setShowTopUp] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stav peněženky</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance.toFixed(2)} Kč</div>
          <Button 
            variant="default" 
            size="default" 
            className="mt-4 w-full bg-primary text-white hover:bg-primary/90 font-medium"
            onClick={() => setShowTopUp(true)}
          >
            <Wallet className="mr-2 h-5 w-5" /> Dobít kredit
          </Button>
        </CardContent>
      </Card>
      <TopUpWalletDialog open={showTopUp} onOpenChange={setShowTopUp} companyId={companyId} />
    </>
  )
}

