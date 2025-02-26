"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Chyba v aplikaci:", error)
    toast.error("Došlo k neočekávané chybě")
  }, [error])

  return (
    <div className="p-4">
      <h2>Něco se pokazilo!</h2>
      <button onClick={reset}>Zkusit znovu</button>
    </div>
  )
} 