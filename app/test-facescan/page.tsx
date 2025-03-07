"use client"

import { useState } from "react"
import { FaceScanStep } from "@/components/verification/face-scan-step"
import { Button } from "@/components/ui/button"

export default function TestFacescanPage() {
  const [showFacescan, setShowFacescan] = useState(false)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Test Facescan</h1>
      
      {showFacescan ? (
        <FaceScanStep 
          onBack={() => setShowFacescan(false)} 
          apiKey="test-api-key"
          customization={{
            primary_color: "#0066cc",
            secondary_color: "#ffffff",
            button_style: "rounded"
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
          <p className="mb-4 text-center">
            Klikněte na tlačítko níže pro otestování funkce Facescan pro ověření věku.
          </p>
          <Button onClick={() => setShowFacescan(true)}>
            Spustit Facescan
          </Button>
        </div>
      )}
    </div>
  )
} 