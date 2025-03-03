// components/account/user-management.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { isCompanyEmail } from "@/lib/utils/email-validation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

const formSchema = z.object({
  email: z
    .string()
    .email("Zadejte platný email")
    .refine(isCompanyEmail, {
      message: "Použijte firemní email (ne Gmail, Seznam, atd.)",
    }),
  first_name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  last_name: z.string().min(2, "Příjmení musí mít alespoň 2 znaky"),
  position: z.string().min(2, "Pozice musí mít alespoň 2 znaky"),
})

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  position: string
  role: 'user' | 'owner'
  status: 'pending' | 'active' | 'inactive'
}

interface UserManagementProps {
  companyId: string
}

export function UserManagement({ companyId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      position: "",
    },
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Vytvoření záznamu v company_users
      const { data: user, error: userError } = await supabase
        .from("company_users")
        .insert({
          company_id: companyId,
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          position: values.position,
          role: 'user',
          status: 'pending'
        })
        .select()
        .single()

      if (userError) throw userError

      // Odeslání aktivačního emailu
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          data: {
            company_user_id: user.id,
            first_name: values.first_name,
          },
        },
      })

      if (emailError) throw emailError

      toast.success("Uživatel byl úspěšně přidán a byl mu odeslán aktivační email")
      form.reset()
      loadUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Nepodařilo se vytvořit uživatele")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from("company_users")
        .update({ status: newStatus })
        .eq("id", userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ))

      toast.success(`Uživatel byl ${newStatus === 'active' ? "aktivován" : "deaktivován"}`)
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Nepodařilo se změnit status uživatele")
    }
  }

  async function deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", userId)

      if (error) throw error

      setUsers(users.filter(user => user.id !== userId))
      toast.success("Uživatel byl úspěšně smazán")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Nepodařilo se smazat uživatele")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jméno</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Příjmení</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Přidávám..." : "Přidat uživatele"}
          </Button>
        </form>
      </Form>

      <div>
        <h3 className="text-lg font-semibold mb-4">Seznam uživatelů</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jméno</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Pozice</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.position}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                    {user.role === "owner" ? "Vlastník" : "Člen"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      user.status === "active" ? "success" : 
                      user.status === "pending" ? "warning" : 
                      "destructive"
                    }
                  >
                    {user.status === "active" ? "Aktivní" : 
                     user.status === "pending" ? "Čeká na potvrzení" : 
                     "Neaktivní"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      disabled={user.role === "owner"}
                    >
                      {user.status === "active" ? "Deaktivovat" : "Aktivovat"}
                    </Button>

                    {user.role !== "owner" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Smazat uživatele</AlertDialogTitle>
                            <AlertDialogDescription>
                              Opravdu chcete smazat uživatele {user.first_name} {user.last_name}?
                              Tuto akci nelze vrátit zpět.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Zrušit</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Smazat
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}