"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  fullName: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  role: z.enum(["user", "admin"], {
    required_error: "Vyberte roli uživatele",
  }),
})

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "user",
    },
  })

  // Kontrola, zda je přihlášený uživatel vlastník
  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single()

      if (userData?.role !== "owner") {
        router.push("/dashboard")
      }
    }
    checkOwnership()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("users").select("*")
      
      if (error) {
        throw error
      }
      
      setUsers(data || [])
    } catch (error) {
      console.error("Chyba při načítání uživatelů:", error)
      toast.error("Nepodařilo se načíst uživatele")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values) {
    try {
      setLoading(true)
      
      // Získat ID společnosti vlastníka
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user?.id)
        .single()

      // Vytvořit nového uživatele
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
      })
      
      if (authError) throw authError
      
      // Vytvořit záznam v users tabulce
      const { error: userError } = await supabase.from("users").insert({
        id: authUser.user.id,
        email: values.email,
        full_name: values.fullName,
        role: values.role,
        company_id: userData.company_id
      })
      
      if (userError) throw userError
      
      toast.success("Uživatel byl úspěšně vytvořen")
      form.reset()
      loadUsers()
    } catch (error) {
      console.error("Chyba při vytváření uživatele:", error)
      toast.error("Nepodařilo se vytvořit uživatele")
    } finally {
      setLoading(false)
    }
  }

  // Načíst uživatele při prvním renderu
  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Správa uživatelů</h1>
      <p className="text-muted-foreground mb-6">Spravujte uživatele, kteří mají přístup k vašemu účtu</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vytvořit nového uživatele</CardTitle>
            <CardDescription>Přidejte nového uživatele s omezenými oprávněními</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heslo</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celé jméno</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte roli" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Uživatel</SelectItem>
                            <SelectItem value="admin">Administrátor</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={loading}>
                  {loading ? "Vytvářím..." : "Vytvořit uživatele"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Seznam uživatelů</CardTitle>
            <CardDescription>Uživatelé s přístupem k vašemu účtu</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Načítám uživatele...</p>
            ) : users.length === 0 ? (
              <p>Žádní uživatelé nebyli nalezeni</p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Role: {user.role}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {/* Implementovat editaci */}}>
                      Upravit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 