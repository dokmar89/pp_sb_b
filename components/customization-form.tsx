"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Eye, Loader2, Upload } from "lucide-react"

import { getCustomization, updateCustomization } from "@/lib/actions/customization"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorPicker } from "@/components/color-picker"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PreviewModal } from "@/components/verification/preview-modal"
import { uploadLogo } from "@/lib/actions/upload"

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

const fonts = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "poppins", label: "Poppins" },
]

const buttonStyles = [
  { value: "rounded", label: "Zaoblené" },
  { value: "square", label: "Hranaté" },
  { value: "pill", label: "Pilulka" },
]

const verificationMethods = [
  { id: "bankid", label: "BankID" },
  { id: "mojeid", label: "MojeID" },
  { id: "ocr", label: "OCR" },
  { id: "facescan", label: "Facescan" },
  { id: "revalidate", label: "Opakované ověření" },
  { id: "other_device", label: "Jiné zařízení" },
]

const failureActions = [
  { value: "redirect", label: "Přesměrovat" },
  { value: "block", label: "Blokovat přístup" },
]

export function CustomizationForm() {
  const searchParams = useSearchParams()
  const shopId = searchParams.get("shopId")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logo: "",
      primaryColor: "#000000",
      secondaryColor: "#FFFFFF",
      font: "inter",
      buttonStyle: "rounded",
      verificationMethods: [],
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

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="URL loga" {...field} />
                  </FormControl>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                    <Button type="button" variant="outline" disabled={isUploading}>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primární barva</FormLabel>
                  <FormControl>
                    <ColorPicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sekundární barva</FormLabel>
                  <FormControl>
                    <ColorPicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Písmo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte písmo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buttonStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Styl tlačítek</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte styl tlačítek" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buttonStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="verificationMethods"
            render={() => (
              <FormItem>
                <FormLabel>Povolené metody ověření</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  {verificationMethods.map((method) => (
                    <FormField
                      key={method.id}
                      control={form.control}
                      name="verificationMethods"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(method.id)}
                              onCheckedChange={(checked) => {
                                const value = field.value || []
                                if (checked) {
                                  field.onChange([...value, method.id])
                                } else {
                                  field.onChange(value.filter((val) => val !== method.id))
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{method.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="failureAction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Akce při neúspěšném ověření</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte akci" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {failureActions.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
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
                <FormItem>
                  <FormLabel>URL pro přesměrování</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exfvfgample.com/error" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Zobrazit náhled
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Ukládám..." : "Uložit nastavení"}
            </Button>
          </div>
        </form>
      </Form>

      <PreviewModal 
        shopId={shopId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        customization={{
          font: currentValues.font,
          primaryColor: currentValues.primaryColor,
          secondaryColor: currentValues.secondaryColor,
          buttonStyle: currentValues.buttonStyle,
          verificationMethods: currentValues.verificationMethods,
          logo: currentValues.logo,
          failureAction: currentValues.failureAction,
          failureRedirect: currentValues.failureRedirect,
        }}
      />
    </div>
  )
}

