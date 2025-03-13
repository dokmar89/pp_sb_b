"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CreditCard, RotateCw, Scan, Monitor, FileText, QrCode, Moon, Sun, Copy, Check, Loader2, Upload, Eye, ArrowLeft, X, Camera, RefreshCw, Lock, Shield, Info, Settings, Palette, ShieldCheck, AlertCircle } from "lucide-react"
import { getCustomization, updateCustomization } from "@/lib/actions/customization"
 import { uploadLogo } from "@/lib/actions/upload"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

const formSchema = z.object({
  logo: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  font: z.string().min(1),
  buttonStyle: z.string().min(1),
  verificationMethods: z.array(z.string()).min(1, "Vyberte alespoň jednu metodu ověření"),
  failureAction: z.string().min(1),
  failureRedirect: z.string().url().optional().or(z.literal("")),
})

// Pomocná funkce pro zesvětlení barvy
const lightenColor = (hex: string, percent: number): string => {
  let R = parseInt(hex.substring(1, 3), 16)
  let G = parseInt(hex.substring(3, 5), 16)
  let B = parseInt(hex.substring(5, 7), 16)

  R = Math.min(255, R + (R * percent / 100))
  G = Math.min(255, G + (G * percent / 100))
  B = Math.min(255, B + (B * percent / 100))

  const RR = R.toString(16).padStart(2, '0')
  const GG = G.toString(16).padStart(2, '0')
  const BB = B.toString(16).padStart(2, '0')

  return `#${RR}${GG}${BB}`
}

export function CustomizationForm() {
  const searchParams = useSearchParams()
  const shopId = searchParams.get("shopId")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logo: "",
      primaryColor: "#173B3F",
      secondaryColor: "#96C4C8",
      font: "inter",
      buttonStyle: "rounded",
      verificationMethods: ["bankid", "mojeid", "ocr", "facescan", "revalidate", "other_device"],
      failureAction: "redirect",
      failureRedirect: "",
    }
  })

  // Načteme data při prvním renderu
  useEffect(() => {
    if (!shopId) return

    getCustomization(shopId).then((result) => {
      if (result.success && result.data) {
        form.reset(result.data)
      }
    })
  }, [shopId, form])

  // Sledujeme změny ve formuláři pro náhled
  const currentValues = form.watch()

  if (!shopId) {
    return <div>Chybí ID eshopu</div>
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const loadingToast = toast.loading("Nahrávám logo...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("shopId", shopId || "")

      const result = await uploadLogo(formData)

      if (result.success && result.url) {
        toast.dismiss(loadingToast)
        toast.success("Logo bylo nahráno")
        form.setValue("logo", result.url)
      } else {
        toast.dismiss(loadingToast)
        toast.error(result.error || "Nepodařilo se nahrát logo")
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Nepodařilo se nahrát logo")
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    const loadingToast = toast.loading("Ukládám nastavení...")

    try {
      const result = await updateCustomization({
        ...values,
        shopId: shopId || "",
      })

      if (result.success) {
        toast.dismiss(loadingToast)
        toast.success("Nastavení bylo úspěšně uloženo", {
          description: "Změny se projeví při příštím ověření",
          duration: 3000,
        })
      } else {
        toast.dismiss(loadingToast)
        toast.error("Nepodařilo se uložit nastavení", {
          description: result.error,
          duration: 4000,
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Došlo k neočekávané chybě", {
        description: "Zkuste to prosím znovu",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyConfig = () => {
    const configToCopy = {
      shopLogo: currentValues.logo || "/placeholder.svg?height=60&width=120",
      welcomeText: "Vítejte! Pro pokračování je nutné ověřit váš věk.",
      primaryColor: currentValues.primaryColor,
      secondaryColor: currentValues.secondaryColor,
      buttonShape: currentValues.buttonStyle,
      fontFamily: currentValues.font,
      showBankID: currentValues.verificationMethods.includes("bankid"),
      showMojeID: currentValues.verificationMethods.includes("mojeid"),
      showOCR: currentValues.verificationMethods.includes("ocr"),
      showFaceScan: currentValues.verificationMethods.includes("facescan"),
      showReVerification: currentValues.verificationMethods.includes("revalidate"),
      showQRCode: currentValues.verificationMethods.includes("other_device"),
      failureAction: currentValues.failureAction,
      failureRedirectUrl: currentValues.failureAction === "redirect" ? currentValues.failureRedirect : undefined,
    };

    navigator.clipboard.writeText(JSON.stringify(configToCopy, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Data pro metody ověření v náhledu
  const verificationMethodsData = [
    { id: "facescan", icon: <Scan className="w-8 h-8" />, title: "FaceScan", description: "Rychlé ověření pomocí kamery." },
    { id: "bankid", icon: <CreditCard className="w-8 h-8" />, title: "BankID", description: "Ověření pomocí bankovní identity." },
    { id: "mojeid", icon: <FileText className="w-8 h-8" />, title: "MojeID", description: "Ověření pomocí MojeID." },
    { id: "ocr", icon: <Monitor className="w-8 h-8" />, title: "Sken dokladu", description: "Ověření platným dokladem." },
    { id: "revalidate", icon: <RotateCw className="w-8 h-8" />, title: "Opakované ověření", description: "Pro již ověřené uživatele." },
    { id: "other_device", icon: <QrCode className="w-8 h-8" />, title: "Jiné zařízení", description: "Dokončení na mobilním telefonu." },
  ];

  // Styly pro náhled podle aktuálního nastavení
  const previewStyles = {
    font: currentValues.font,
    primaryColor: currentValues.primaryColor,
    secondaryColor: currentValues.secondaryColor,
    buttonRadius: currentValues.buttonStyle === "pill" ? "9999px" : currentValues.buttonStyle === "rounded" ? "8px" : "0px",
    lightPrimaryColor: lightenColor(currentValues.primaryColor, 90),
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Tabs navigation */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setActiveTab("basic")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "basic"
              ? "bg-white shadow text-primary"
              : "hover:bg-white/50 text-gray-600"
          }`}
        >
          <Settings className="h-4 w-4" />
          Základní nastavení
        </button>
        <button
          onClick={() => setActiveTab("design")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "design"
              ? "bg-white shadow text-primary"
              : "hover:bg-white/50 text-gray-600"
          }`}
        >
          <Palette className="h-4 w-4" />
          Vzhled
        </button>
        <button
          onClick={() => setActiveTab("methods")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "methods"
              ? "bg-white shadow text-primary"
              : "hover:bg-white/50 text-gray-600"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Metody ověření
        </button>
        <button
          onClick={() => setActiveTab("failure")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "failure"
              ? "bg-white shadow text-primary"
              : "hover:bg-white/50 text-gray-600"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Neúspěšné ověření
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Levá strana - aktivní karta s nastavením */}
            <div>
              {activeTab === "basic" && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-6">Základní nastavení</h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Logo e-shopu (URL)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="URL loga"
                                  {...field}
                                  className="dark:bg-gray-800 dark:border-gray-700"
                                />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={handleLogoUpload}
                                  disabled={isUploading}
                                />
                                <Button type="button" variant="outline" disabled={isUploading} className="dark:bg-gray-800 dark:border-gray-700">
                                  {isUploading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Nahrávám...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Nahrát
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            {field.value && (
                              <div className="mt-2">
                                <img
                                  src={field.value}
                                  alt="Logo náhled"
                                  className="h-12 w-auto object-contain border rounded p-1"
                                />
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="font"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Font</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger id="fontFamily" className="dark:bg-gray-800 dark:border-gray-700">
                                  <SelectValue placeholder="Vyberte font" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="open-sans">Open Sans</SelectItem>
                                <SelectItem value="montserrat">Montserrat</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "design" && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-6">Vzhled</h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Primární barva</FormLabel>
                            <div className="flex gap-2">
                              <Input
                                id="primaryColor"
                                type="color"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="dark:bg-gray-800 dark:border-gray-700"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Sekundární barva</FormLabel>
                            <div className="flex gap-2">
                              <Input
                                id="secondaryColor"
                                type="color"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="dark:bg-gray-800 dark:border-gray-700"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buttonStyle"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Tvar tlačítek</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger id="buttonShape" className="dark:bg-gray-800 dark:border-gray-700">
                                  <SelectValue placeholder="Vyberte tvar tlačítek" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rounded">Zaoblené</SelectItem>
                                <SelectItem value="square">Hranaté</SelectItem>
                                <SelectItem value="pill">Pilulka</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />

                      <div>
                        <p className="text-sm font-medium mb-3">Doporučené barvy PassProve</p>
                        <div className="grid grid-cols-5 gap-2">
                          <button
                            type="button"
                            className="h-10 rounded-md border transition-transform hover:scale-105"
                            style={{ backgroundColor: "#173B3F" }}
                            onClick={() => form.setValue("primaryColor", "#173B3F")}
                          />
                          <button
                            type="button"
                            className="h-10 rounded-md border transition-transform hover:scale-105"
                            style={{ backgroundColor: "#96C4C8" }}
                            onClick={() => form.setValue("secondaryColor", "#96C4C8")}
                          />
                          <button
                            type="button"
                            className="h-10 rounded-md border transition-transform hover:scale-105"
                            style={{ backgroundColor: "#F0D423" }}
                            onClick={() => form.setValue("primaryColor", "#F0D423")}
                          />
                          <button
                            type="button"
                            className="h-10 rounded-md border transition-transform hover:scale-105"
                            style={{ backgroundColor: "#9D9D9C" }}
                            onClick={() => form.setValue("primaryColor", "#9D9D9C")}
                          />
                          <button
                            type="button"
                            className="h-10 rounded-md border transition-transform hover:scale-105"
                            style={{ backgroundColor: "#1D1D1B" }}
                            onClick={() => form.setValue("primaryColor", "#1D1D1B")}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "methods" && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-6">Metody ověření</h3>
                    <FormField
                      control={form.control}
                      name="verificationMethods"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showBankID" className="cursor-pointer">
                                BankID
                              </Label>
                            </div>
                            <Switch
                              id="showBankID"
                              checked={field.value?.includes("bankid")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "bankid"]
                                  : field.value.filter(m => m !== "bankid");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <Scan className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showMojeID" className="cursor-pointer">
                                mojeID
                              </Label>
                            </div>
                            <Switch
                              id="showMojeID"
                              checked={field.value?.includes("mojeid")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "mojeid"]
                                  : field.value.filter(m => m !== "mojeid");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <Scan className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showOCR" className="cursor-pointer">
                                OCR
                              </Label>
                            </div>
                            <Switch
                              id="showOCR"
                              checked={field.value?.includes("ocr")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "ocr"]
                                  : field.value.filter(m => m !== "ocr");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <Camera className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showFaceScan" className="cursor-pointer">
                                Face Scan
                              </Label>
                            </div>
                            <Switch
                              id="showFaceScan"
                              checked={field.value?.includes("facescan")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "facescan"]
                                  : field.value.filter(m => m !== "facescan");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <RefreshCw className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showReVerification" className="cursor-pointer">
                                Opakované ověření
                              </Label>
                            </div>
                            <Switch
                              id="showReVerification"
                              checked={field.value?.includes("revalidate")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "revalidate"]
                                  : field.value.filter(m => m !== "revalidate");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#173B3F20]">
                                <QrCode className="h-5 w-5" />
                              </div>
                              <Label htmlFor="showQRCode" className="cursor-pointer">
                                QR kód
                              </Label>
                            </div>
                            <Switch
                              id="showQRCode"
                              checked={field.value?.includes("other_device")}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...field.value, "other_device"]
                                  : field.value.filter(m => m !== "other_device");
                                field.onChange(updatedMethods);
                              }}
                            />
                          </div>
                          <FormMessage className="mt-2" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === "failure" && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-6">Neúspěšné ověření</h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="failureAction"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Akce při neúspěšném ověření</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Vyberte akci" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="block">Zablokovat přístup</SelectItem>
                                <SelectItem value="redirect">Přesměrovat na URL</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("failureAction") === "redirect" && (
                        <FormField
                          control={form.control}
                          name="failureRedirect"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>URL pro přesměrování</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://vas-eshop.cz/vekove-omezeni"
                                  {...field}
                                  className="w-full"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">
                                Zadejte URL, na kterou bude uživatel přesměrován při neúspěšném ověření
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch("failureAction") === "block" && (
                        <div className="rounded-md bg-gray-50 p-4">
                          <div className="flex">
                            <Info className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm text-gray-500">
                              Při zablokování přístupu uživatel uvidí informační zprávu a nebude moci pokračovat v nákupu.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pravá strana - vždy viditelný náhled */}
            <div className="space-y-6">
              {/* Náhled */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Náhled</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border">
                    <div className="w-full max-w-xs mx-auto">
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                          <div className="text-sm font-medium">Váš E-shop</div>
                          <div className="text-xs text-gray-500">Košík (3)</div>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-4">
                              Pro pokračování k pokladně je nutné ověřit váš věk
                            </p>
                            <Button
                              type="button"
                              onClick={() => setPreviewOpen(true)}
                              style={{ backgroundColor: currentValues.primaryColor }}
                              className="px-6"
                            >
                              Ověřit věk
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Implementace */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Implementace</h3>
                  <div className="bg-gray-900 rounded-lg p-4 text-gray-300 text-sm font-mono overflow-auto max-h-[300px]">
                    <pre className="whitespace-pre-wrap">
{`// Přidejte tento kód do vašeho e-shopu
import AgeVerificationModal from '@passprove/age-verification';

// V komponentě vašeho e-shopu
const [isVerificationOpen, setIsVerificationOpen] = useState(false);

// Konfigurace
const verificationConfig = ${JSON.stringify({
  shopLogo: currentValues.logo || "/placeholder.svg?height=60&width=120",
  welcomeText: "Vítejte! Pro pokračování je nutné ověřit váš věk.",
  primaryColor: currentValues.primaryColor,
  secondaryColor: currentValues.secondaryColor,
  buttonShape: currentValues.buttonStyle,
  fontFamily: currentValues.font,
  showBankID: currentValues.verificationMethods.includes("bankid"),
  showMojeID: currentValues.verificationMethods.includes("mojeid"),
  showOCR: currentValues.verificationMethods.includes("ocr"),
  showFaceScan: currentValues.verificationMethods.includes("facescan"),
  showReVerification: currentValues.verificationMethods.includes("revalidate"),
  showQRCode: currentValues.verificationMethods.includes("other_device"),
}, null, 2)};

// Funkce pro zpracování ověření
const handleVerification = (method) => {
  // Zde zpracujte výsledek ověření
  console.log(\`Metoda ověření: \${method}\`);
};

// Tlačítko pro otevření ověření
<button onClick={() => setIsVerificationOpen(true)}>
  Ověřit věk
</button>

// Komponenta modálního okna
<AgeVerificationModal
  isOpen={isVerificationOpen}
  onClose={() => setIsVerificationOpen(false)}
  onVerificationSelected={handleVerification}
  {...verificationConfig}
/>`}
                    </pre>
                  </div>
                  <Button
                    type="button"
                    onClick={copyConfig}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Zkopírováno
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Zkopírovat konfiguraci
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: currentValues.primaryColor }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ukládám...
                </>
              ) : "Uložit nastavení"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Dialog pro náhled */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="sm:max-w-[800px] p-0 gap-0 border-0 shadow-2xl flex items-center justify-center"
          style={{
            fontFamily: currentValues.font === "inter"
              ? "Inter, sans-serif"
              : currentValues.font === "roboto"
                ? "Roboto, sans-serif"
                : currentValues.font === "poppins"
                  ? "Poppins, sans-serif"
                  : currentValues.font === "open-sans"
                    ? "Open Sans, sans-serif"
                    : "Montserrat, sans-serif",
            maxHeight: "95vh",
            overflow: "auto",
          }}
        >
          <div className="flex flex-col md:flex-row h-full w-full">
            {/* Levý sloupec - Logo a popis (1/4) */}
            <div
              className="md:w-1/4 p-6 flex flex-col items-center justify-center text-center"
              style={{
                background: `linear-gradient(135deg, ${currentValues.primaryColor}, ${currentValues.secondaryColor})`,
              }}
            >
              <div className="flex flex-col items-center text-white">
                {currentValues.logo && (
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl mb-4 inline-block">
                    <img
                      src={currentValues.logo || "/placeholder.svg"}
                      alt="E-shop logo"
                      className="h-12 max-w-[120px] object-contain"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 text-xs text-white/70 mt-6">
                  <img
                    src="/Logo_PassProve_cerna.svg"
                    alt="PassProve Logo"
                    className="h-20"
                  /><h3 className="text-lg font-medium mb-3">Ověření věku</h3>
                  <p className="text-white/80 text-sm">
                    Vítejte! Pro pokračování je nutné ověřit váš věk.
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/20 w-full">
                    <div className="flex items-center gap-2 text-xs text-white/70 mb-3">
                      <Lock className="h-4 w-4" />
                      <span>Šifrovaný přenos dat</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70 mb-3">
                      <Shield className="h-4 w-4" />
                      <span>Zabezpečené ověření</span>
                    </div>
                    <div className="flex items-bottom gap-2 text-xs text-white/70 mb-3"></div>
                    <span className="text-xs">Zabezpečeno technologií PassProve</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pravý sloupec - Metody ověření (3/4) */}
            <div className="md:w-3/4 bg-white dark:bg-gray-800 p-6 relative flex flex-col justify-center h-full">
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-2 text-center" style={{ color: currentValues.primaryColor }}>
                  Vyberte způsob ověření
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  Zvolte jednu z následujících metod pro ověření vašeho věku
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-center">
                {verificationMethodsData.map((method) => (
                  currentValues.verificationMethods.includes(method.id) && (
                    <div
                      key={method.id}
                      className={`group h-full cursor-pointer transition-all border-2 shadow-sm hover:shadow-md ${
                        currentValues.buttonStyle === "square"
                          ? "rounded-none"
                          : currentValues.buttonStyle === "pill"
                            ? "rounded-xl"
                            : "rounded-md"
                      }`}
                      style={{
                        borderColor: "transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div className="p-4 flex flex-col items-center text-center h-full">
                        <div
                          className="p-3 rounded-full mb-3 mt-2"
                          style={{ backgroundColor: `${currentValues.primaryColor}15` }}
                        >
                          {method.icon}
                        </div>
                        <div className="font-medium mb-1">{method.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{method.description}</div>

                        <div className="flex items-center gap-1 mt-auto mb-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: method.id === "bankid" || method.id === "mojeid"
                                ? "#10b981"
                                : "#f59e0b"
                            }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Úroveň zabezpečení: {method.id === "bankid" || method.id === "mojeid" ? "Vysoká" : "Střední"}
                          </span>
                        </div>

                        <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 dark:text-gray-500 gap-2">
                  <div className="flex gap-4">
                    <span className="hover:underline hover:text-gray-600 dark:hover:text-gray-300">
                      Obchodní podmínky
                    </span>
                    <span className="hover:underline hover:text-gray-600 dark:hover:text-gray-300">
                      O službě
                    </span>
                    <span className="hover:underline hover:text-gray-600 dark:hover:text-gray-300">
                      Ochrana soukromí
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span>© {new Date().getFullYear()} PassProve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}