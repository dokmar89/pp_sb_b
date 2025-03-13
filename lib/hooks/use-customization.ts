import { useEffect, useState } from "react"

interface CustomizationOptions {
  primary_color: string
  secondary_color: string
  font: string
  button_style: string
  verification_methods: string[]
  failure_action: string
  failure_redirect?: string
  logo_url?: string
}

export const useCustomization = (shopId: string, apiKey: string) => {
  const [customization, setCustomization] = useState<CustomizationOptions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shopId || !apiKey) return

    async function fetchCustomization() {
      try {
        const response = await fetch("http://localhost:3003/api/widget/customization", {
  headers: {
    Authorization: `Bearer ${apiKey}`
  }
});

        const data = await response.json()
        if (response.ok) {
          setCustomization(data)
        } else {
          console.error("Chyba načítání:", data.error)
        }
      } catch (error) {
        console.error("Chyba při volání API:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomization()
  }, [shopId, apiKey])

  return { customization, loading }
}
