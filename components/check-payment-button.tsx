"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ReloadIcon } from "@radix-ui/react-icons"

interface CheckPaymentButtonProps {
  transactionNumber: string
  onPaymentConfirmed?: () => void
}

export function CheckPaymentButton({ transactionNumber, onPaymentConfirmed }: CheckPaymentButtonProps) {
  const [isChecking, setIsChecking] = useState(false)

  const checkPayment = async () => {
    setIsChecking(true)
    try {
      // Zavoláme FIO kontrolu manuálně
      const response = await fetch('/api/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionNumber }),
      })

      const data = await response.json()

      if (data.status === 'completed') {
        toast.success('Platba byla úspěšně přijata!')
        onPaymentConfirmed?.()
      } else {
        toast.info('Platba zatím nebyla přijata. Zkuste to prosím později.')
      }
    } catch (error) {
      toast.error('Chyba při kontrole platby')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button 
      onClick={checkPayment} 
      disabled={isChecking}
      variant="outline"
      size="sm"
    >
      {isChecking ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Kontroluji platbu...
        </>
      ) : (
        'Zkontrolovat platbu'
      )}
    </Button>
  )
} 