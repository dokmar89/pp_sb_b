"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { createShop } from "@/lib/actions/shops"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  name: z.string().min(2, "Název eshopu musí mít alespoň 2 znaky"),
  url: z.string().url("Zadejte platnou URL adresu"),
  sector: z.string().min(1, "Vyberte sektor"),
  verificationMethods: z.array(z.string()).min(1, "Vyberte alespoň jednu metodu ověření"),
  integrationType: z.string().min(1, "Vyberte typ integrace"),
  pricingPlan: z.string().min(1, "Vyberte cenový plán"),
})

const sectors = [
  { value: "pyrotechnika", label: "Pyrotechnika" },
  { value: "kuracke-potreby", label: "Kuřácké potřeby" },
  { value: "chemicke-latky", label: "Chemické a nebezpečné látky" },
  { value: "eroticke-zbozi", label: "Erotické zboží" },
  { value: "online-hazard", label: "Online hazard" },
  { value: "jine", label: "Jiné" },
]

const verificationMethods = [
  { id: "bankid", label: "BankID" },
  { id: "mojeid", label: "MojeID" },
  { id: "ocr", label: "OCR" },
  { id: "facescan", label: "Facescan" },
]

const integrationTypes = [
  { value: "api", label: "API (vlastní řešení)" },
  { value: "widget", label: "Widget" },
  { value: "plugin", label: "Plugin pro platformu" },
]

const pricingPlans = [
  { value: "contract", label: "Se smlouvou na 2 roky" },
  { value: "no-contract", label: "Bez smlouvy" },
]

interface AddShopDialogProps {
  companyId: string;
}

export function AddShopDialog({ companyId }: AddShopDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      sector: "",
      verificationMethods: [],
      integrationType: "",
      pricingPlan: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createShop({
        ...values,
        companyId: companyId
      })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Eshop byl úspěšně přidán")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error creating shop:", error)
      toast.error("Došlo k chybě při vytváření eshopu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Přidat eshop</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Přidat nový eshop</DialogTitle>
          <DialogDescription>Vyplňte informace o vašem eshopu pro vytvoření API klíče</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název eshopu</FormLabel>
                  <FormControl>
                    <Input placeholder="Můj eshop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL adresa</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.mujeshop.cz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sektor zboží</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte sektor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          {sector.label}
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
              name="verificationMethods"
              render={() => (
                <FormItem>
                  <FormLabel>Metody ověření</FormLabel>
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
              name="integrationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Způsob integrace</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte způsob integrace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {integrationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="pricingPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cenový plán</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte cenový plán" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pricingPlans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Vytvořit eshop
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
