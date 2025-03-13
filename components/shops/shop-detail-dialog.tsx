"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getShopDetails } from "@/lib/actions/shops"

interface ShopDetailsDialogProps {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShopDetailsDialog({ shopId, open, onOpenChange }: ShopDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [shop, setShop] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && shopId) {
      const fetchShopDetails = async () => {
        setIsLoading(true)
        setError(null)

        try {
          const result = await getShopDetails(shopId);
          if (result.success && result.shop) {
            setShop(result.shop);
          } else {
            setError(result.error || "Nepodařilo se načíst detaily eshopu");
            toast.error(result.error || "Nepodařilo se načíst detaily eshopu"); // Show error toast
          }
        } catch (error) {
          console.error("Error fetching shop details:", error);
          setError("Došlo k neočekávané chybě");
          toast.error("Došlo k neočekávané chybě"); // Show error toast
        } finally {
          setIsLoading(false);
        }
      }

      fetchShopDetails()
    }
  }, [shopId, open])

  const copyApiKey = () => {
    if (shop?.apiKey) {
      navigator.clipboard.writeText(shop.apiKey)
      toast.success("API klíč byl zkopírován do schránky")
    }
  }

  const copyWidgetCode = () => {
    if (shop?.apiKey) {
      const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget.js?apiKey=${shop.apiKey}"></script>`;
      navigator.clipboard.writeText(code);
      toast.success("Kód widgetu byl zkopírován do schránky");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail eshopu</DialogTitle>
          <DialogDescription>
            Zobrazení detailních informací o eshopu
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">
            {error}
          </div>
        ) : shop ? (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Přehled</TabsTrigger>
              <TabsTrigger value="integration">Integrace</TabsTrigger>
              <TabsTrigger value="statistics">Statistiky</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <div>
                <Label>ID eshopu</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded mt-1">{shop.id}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Název eshopu</Label>
                  <div className="font-medium text-lg">{shop.name}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>
                    <Badge variant={shop.status === "active" ? "default" : "outline"}>
                      {shop.status === "active" ? "Aktivní" : "Neaktivní"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label>Sektor zboží</Label>
                <div className="font-medium mt-1">
                  {shop.sector || "Není specifikováno"}
                </div>
              </div>

              <div>
                <Label>URL eshopu</Label>
                <div className="flex items-center gap-2">
                  <a
                    href={shop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {shop.url.replace(/^https?:\/\//, '')}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
            	<Label>API klíč</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-sm">
                    {shop.apiKey}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyApiKey}>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopírovat
                  </Button>
                </div>
              </div>

              <div>
                <Label>Vytvořeno</Label>
                <div>{formatDate(shop.createdAt)}</div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>JavaScript Widget</CardTitle>
                  <CardDescription>
                    Nejjednodušší způsob integrace - stačí vložit tento kód do vašeho webu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded bg-muted p-4 font-mono text-sm">
                      {`<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget.js?apiKey=${shop.apiKey}"></script>`}
                    </div>
                    <Button variant="outline" onClick={copyWidgetCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      Kopírovat kód
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>REST API</CardTitle>
                  <CardDescription>
                    Pro pokročilou integraci můžete použít naše REST API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Endpoint</Label>
                      <Input
                        readOnly
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/api/verify`}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label>Autorizace</Label>
                      <div className="rounded bg-muted p-4 font-mono text-sm">
                        {`Authorization: Bearer ${shop.apiKey}`}
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" asChild>
                        <a
                          href="https://docs.ageverification.cz" // Use a constant for documentation URL
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Zobrazit dokumentaci API
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Celkem ověření</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {shop.stats?.total_verifications || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Průměrný čas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="text-3xl font-bold">
                        {shop.stats?.average_time ? `${(shop.stats.average_time / 1000).toFixed(1)}s` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      Úspěšná ověření
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">
                      {shop.stats?.successful_verifications || 0}
                    </div>
                    {shop.stats?.total_verifications > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {Math.round((shop.stats.successful_verifications / shop.stats.total_verifications) * 100)}% úspěšnost
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-500" />
                      Neúspěšná ověření
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">
                      {shop.stats?.failed_verifications || 0}
                    </div>
                    {shop.stats?.total_verifications > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {Math.round((shop.stats.failed_verifications / shop.stats.total_verifications) * 100)}% neúspěšnost
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Eshop nebyl nalezen
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}