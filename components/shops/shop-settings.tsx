"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  webhook_url: z.string().url().optional(),
  notification_email: z.string().email().optional(),
  auto_verification: z.boolean(),
  verification_mode: z.enum(["strict", "moderate", "lenient"]),
})

interface ShopSettingsProps {
  companyId: string
}

export function ShopSettings({ companyId }: ShopSettingsProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      webhook_url: "",
      notification_email: "",
      auto_verification: false,
      verification_mode: "moderate",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="webhook_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL</FormLabel>
              <FormControl>
                <Input placeholder="https://vas-eshop.cz/webhook" {...field} />
              </FormControl>
              <FormDescription>
                URL adresa pro zasílání notifikací o výsledcích verifikace
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notification_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notifikační email</FormLabel>
              <FormControl>
                <Input placeholder="notifikace@vas-eshop.cz" {...field} />
              </FormControl>
              <FormDescription>
                Email pro zasílání důležitých upozornění
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="auto_verification"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Automatická verifikace
                </FormLabel>
                <FormDescription>
                  Automaticky ověřovat věk při každé návštěvě
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verification_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Režim verifikace</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte režim verifikace" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="strict">Striktní</SelectItem>
                  <SelectItem value="moderate">Standardní</SelectItem>
                  <SelectItem value="lenient">Mírný</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Určuje přísnost ověřování věku
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Uložit nastavení</Button>
      </form>
    </Form>
  )
} 