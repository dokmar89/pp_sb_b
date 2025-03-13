'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { ReloadIcon } from "@radix-ui/react-icons"

export function CheckAllPaymentsButton() {
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  const handleCheck = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/check-payment', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success('Kontrola plateb byla dokončena')
        router.refresh()
      } else {
        toast.error('Chyba při kontrole plateb')
      }
    } catch (error) {
      toast.error('Chyba při kontrole plateb')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button 
      onClick={handleCheck} 
      disabled={isChecking}
      variant="outline"
    >
      {isChecking ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Kontroluji platby...
        </>
      ) : (
        'Zkontrolovat všechny platby'
      )}
    </Button>
  )
} 