"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { UserPlus, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const isCompanyEmail = (email: string) => {
  const freeDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "zoho.com",
    "mail.com",
    "gmx.com",
    "seznam.cz",
    "centrum.cz",
    "atlas.cz",
    "email.cz",
    "post.cz",
  ]
  const domain = email.split("@")[1]
  return !freeDomains.includes(domain)
}

const formSchema = z.object({
  firstName: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  lastName: z.string().min(2, "Příjmení musí mít alespoň 2 znaky"),
  position: z.string().min(2, "Pozice musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatný email").refine(isCompanyEmail, {
    message: "Použijte firemní email (ne Gmail, Yahoo, atd.)",
  }),
  consent: z.boolean().refine((value) => value === true, {
    message: "Musíte souhlasit s podmínkami",
  }),
})

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  position: string
  role: string
  status: string
  created_at: string
}

interface UserManagementProps {
  companyId: string
}

export function UserManagement({ companyId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      consent: false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      // Nejprve zkontrolujeme, zda uživatel s tímto emailem již neexistuje
      const { data: existingUsers, error: checkError } = await supabase
        .from("company_users")
        .select("id")
        .eq("email", values.email)
        .limit(1);
        
      if (checkError) {
        console.error("Error checking existing user:", checkError);
        throw new Error("Nepodařilo se ověřit existenci uživatele");
      }
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Uživatel s tímto emailem již existuje");
      }
      
      // Pokud uživatel neexistuje, vytvoříme ho
      const { error } = await supabase.from("company_users").insert({
        company_id: companyId,
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        position: values.position,
        role: "user",
        status: "pending"
      })

      if (error) {
        console.error("Error details:", error);
        if (error.code === '23505') { // Unique constraint violation
          throw new Error("Uživatel s tímto emailem již existuje");
        }
        throw new Error("Nepodařilo se pozvat uživatele: " + error.message);
      }

      toast.success("Pozvánka byla odeslána")
      form.reset()
      loadUsers()
    } catch (error) {
      console.error("Error inviting user:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Nepodařilo se pozvat uživatele";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  async function loadUsers() {
    try {
      setIsLoadingUsers(true)
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Nepodařilo se načíst uživatele")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  async function resendInvitation(userId: string) {
    try {
      // Simulate resending the invitation
      // In a real implementation, we would invoke the resend-invitation function
      console.log("Pozvánka by byla znovu odeslána pro uživatele:", userId)
      toast.success("Pozvánka byla znovu odeslána")
    } catch (error) {
      toast.error("Nepodařilo se znovu odeslat pozvánku")
    }
  }

  async function removeUser(userId: string) {
    try {
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", userId)

      if (error) throw error
      toast.success("Uživatel byl odebrán")
      loadUsers()
    } catch (error) {
      toast.error("Nepodařilo se odebrat uživatele")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Správa uživatelů</CardTitle>
        <CardDescription>Pozvěte kolegy do systému. Firemní účty zdarma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jméno</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Příjmení</FormLabel>
                      <FormControl>
                        <Input placeholder="Novák" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="jan.novak@vase-firma.cz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pozice</FormLabel>
                      <FormControl>
                        <Input placeholder="Manažer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Souhlas s podmínkami</FormLabel>
                      <FormDescription>Uživatel obdrží pozvánku emailem a bude mít přístup k datům.</FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Odesílám...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Pozvat uživatele
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div>
            <h3 className="text-lg font-medium mb-4">Seznam uživatelů</h3>
            {isLoadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jméno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pozice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "outline"}>
                          {user.status === "active" ? "Aktivní" : "Čeká na potvrzení"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => resendInvitation(user.id)}>
                            Znovu poslat
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => removeUser(user.id)}>
                          Odebrat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Zatím zde nejsou žádní uživatelé.
                <div className="mt-2">Začněte tím, že pozvete někoho pomocí formuláře výše.</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}