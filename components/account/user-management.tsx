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
import { PlusCircle, MoreVertical, Mail, Shield, Briefcase } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddUserDialog } from "./add-user-dialog"

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
  avatar: string
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Uživatelé</h2>
          <p className="text-sm text-muted-foreground">
            Celkem uživatelů: {users.length}
          </p>
        </div>
        <AddUserDialog onSubmit={onSubmit} />
      </div>

      <div className="divide-y divide-border rounded-lg border">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/10">
                  {user.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.first_name} {user.last_name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge 
                variant="secondary"
                className="flex items-center gap-1"
              >
                <Briefcase className="h-3 w-3" />
                {user.position}
              </Badge>
              
              <Badge 
                variant={user.status === "active" ? "success" : "secondary"}
                className="flex items-center gap-1"
              >
                {user.status === "active" ? "Aktivní" : "Neaktivní"}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.status)}>
                    {user.status === "active" ? "Deaktivovat" : "Aktivovat"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteUser(user.id)}
                    className="text-destructive"
                  >
                    Smazat uživatele
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}