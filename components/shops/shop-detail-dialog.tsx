"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, AlertTriangle, Upload } from "lucide-react"
import { toast } from "sonner"
import { updateShopStatus, getShopDetails } from "@/lib/actions/shops"
import { uploadLogo } from "@/lib/actions/upload"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

interface ShopDetails {
  id: string
  name: string
  url: string
  status: 'active' | 'inactive'
  apiKey: string
  integration_type: 'api' | 'widget' | 'plugin'
  pricing_plan: 'contract' | 'no-contract'
  verification_methods: string[]
  logo_url?: string | null
  stats: {
    total_verifications: number
    successful_verifications: number
    failed_verifications: number
    average_time: number
  }
}

interface ShopDetailDialogProps {
  shopId: string
  isOpen: boolean
  onClose: () => void
}

const verificationMethodLabels = {
  'bankid': 'BankID',
  'mojeid': 'MojeID',
  'facescan': 'Skenování obličeje',
  'ocr': 'Skenování dokladů',
  'revalidate': 'Opakované ověření'
}

const integrationTypeLabels = {
  'api': 'REST API',
  'widget': 'JavaScript Widget',
  'plugin': 'Plugin pro e-shop'
}

const verificationPrices = {
  'bankid': { contract: 15, noContract: 20 },
  'mojeid': { contract: 12, noContract: 15 },
  'facescan': { contract: 4, noContract: 5 },
  'ocr': { contract: 8, noContract: 10 },
  'revalidate': { contract: 1, noContract: 2 }
}

export function ShopDetailDialog({ shopId, isOpen, onClose }: ShopDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient<Database>()

  const loadShopDetails = async () => {
    setIsLoading(true)
    try {
      const result = await getShopDetails(shopId)
      if (result.success) {
        setShopDetails(result.shop)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Nepodařilo se načíst detaily eshopu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const result = await updateShopStatus(shopId, newStatus)
      if (result.success) {
        toast.success(`Status eshopu byl změněn na ${newStatus}`)
        await loadShopDetails()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Nepodařilo se změnit status eshopu")
    }
  }

  const handleRegenerateApiKey = async () => {
    setIsRegeneratingKey(true)
    try {
      const result = await fetch(`/api/shops/${shopId}/regenerate-key`, {
        method: 'POST',
      })
      const data = await result.json()
      
      if (data.success) {
        toast.success("API klíč byl úspěšně obnoven")
        await loadShopDetails()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error("Nepodařilo se obnovit API klíč")
    } finally {
      setIsRegeneratingKey(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('shopId', shopId)

      const result = await uploadLogo(formData)

      if (result.success) {
        toast.success('Logo bylo úspěšně nahráno')
        await loadShopDetails() // Znovu načteme detaily pro zobrazení nového loga
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Nepodařilo se nahrát logo')
      console.error('Logo upload error:', error)
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = '' // Reset input
      }
    }
  }

  const handleLogoRemove = async () => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ logo_url: null })
        .eq('id', shopId)
      
      if (error) throw error
      
      toast.success('Logo bylo odstraněno')
      await loadShopDetails()
    } catch (error) {
      toast.error('Nepodařilo se odstranit logo')
    }
  }

  // Načtení detailů při otevření
  useState(() => {
    if (isOpen && shopId) {
      loadShopDetails()
    }
  }, [isOpen, shopId])

  if (!shopDetails && isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail eshopu: {shopDetails?.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="methods">Metody</TabsTrigger>
            <TabsTrigger value="stats">Statistiky</TabsTrigger>
            <TabsTrigger value="settings">Nastavení</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">URL</p>
                    <p className="text-sm text-muted-foreground">{shopDetails?.url}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={shopDetails?.status === 'active' ? 'success' : 'destructive'}>
                      {shopDetails?.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium">API Klíč</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="rounded bg-muted px-2 py-1 flex-1">{shopDetails?.apiKey}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateApiKey}
                        disabled={isRegeneratingKey}
                      >
                        {isRegeneratingKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Regenerace API klíče způsobí, že všechny současné implementace přestanou fungovat.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle>Konfigurace ověřování</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Typ integrace</h3>
                  <Badge variant="secondary">
                    {integrationTypeLabels[shopDetails?.integration_type as keyof typeof integrationTypeLabels] || 'Neurčeno'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Cenový plán</h3>
                  <Badge variant="secondary">
                    {shopDetails?.pricing_plan === 'contract' ? 'Se smlouvou na 2 roky' : 'Bez smlouvy'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Povolené metody ověření</h3>
                  <div className="grid gap-4">
                    {(shopDetails?.verification_methods || []).map((method: string) => (
                      <div key={method} className="flex items-center justify-between p-2 rounded-lg border">
                        <div>
                          <p className="font-medium">{verificationMethodLabels[method as keyof typeof verificationMethodLabels]}</p>
                          <p className="text-sm text-muted-foreground">
                            Cena: {shopDetails?.pricing_plan === 'contract' 
                              ? verificationPrices[method as keyof typeof verificationPrices].contract 
                              : verificationPrices[method as keyof typeof verificationPrices].noContract} Kč
                          </p>
                        </div>
                        <Badge variant="success">Aktivní</Badge>
                      </div>
                    ))}
                    {(!shopDetails?.verification_methods || shopDetails.verification_methods.length === 0) && (
                      <div className="text-center p-4 text-muted-foreground">
                        Žádné metody ověření nejsou povoleny
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistiky verifikací</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Celkem verifikací</p>
                    <p className="text-2xl font-bold">{shopDetails?.stats.total_verifications}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Úspěšných</p>
                    <p className="text-2xl font-bold text-green-600">
                      {shopDetails?.stats.successful_verifications}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Neúspěšných</p>
                    <p className="text-2xl font-bold text-red-600">
                      {shopDetails?.stats.failed_verifications}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Průměrný čas</p>
                    <p className="text-2xl font-bold">{shopDetails?.stats.average_time}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Status eshopu</p>
                    <div className="flex gap-2">
                      <Button
                        variant={shopDetails?.status === 'active' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange('active')}
                      >
                        Aktivovat
                      </Button>
                      <Button
                        variant={shopDetails?.status === 'inactive' ? 'destructive' : 'outline'}
                        onClick={() => handleStatusChange('inactive')}
                      >
                        Deaktivovat
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Logo eshopu</h3>
                  <div className="flex items-start gap-4">
                    {shopDetails?.logo_url && (
                      <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        <img
                          src={shopDetails.logo_url}
                          alt="Shop logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        variant="outline"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {shopDetails?.logo_url ? 'Změnit logo' : 'Nahrát logo'}
                      </Button>
                      {shopDetails?.logo_url && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={handleLogoRemove}
                        >
                          Odstranit logo
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Podporované formáty: PNG, JPG, GIF (max. 2MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 