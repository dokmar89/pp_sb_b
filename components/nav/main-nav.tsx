"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { 
  LayoutDashboard,
  CreditCard, 
  HelpCircle, 
  Store, 
  Code2,
  User,
  Paintbrush,
  LogOut,
  Sun,
  Moon
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

type NavigationItem = {
  title: string
  href: string
  icon: any
}

const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Účet",
    href: "/account",
    icon: User
  },
  {
    title: "Fakturace",
    href: "/billing",
    icon: CreditCard
  },
  {
    title: "Obchody",
    href: "/dashboard/shops",
    icon: Store
  },
  {
    title: "Přizpůsobení",
    href: "/dashboard/customize",
    icon: Paintbrush
  },
  {
    title: "Podpora",
    href: "/support",
    icon: HelpCircle
  },
  {
    title: "Instalace",
    href: "/installation",
    icon: Code2
  }
]

export function MainNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkUserRole() {
      try {
        setIsLoading(true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Error getting session:", sessionError)
          return
        }

        if (session) {
          // Nastavíme email uživatele ze session
          setUserName(session.user.email || "")

          // Načteme data o společnosti
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("name")
            .eq("user_id", session.user.id)
            .maybeSingle()

          if (companyError) {
            console.error("Error fetching company:", companyError)
          } else if (companyData) {
            setIsAdmin(true)
            setCompanyName(companyData.name)
          }

          // Pokud máme jméno uživatele, přepíšeme email
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", session.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user:", userError)
          } else if (userData?.full_name) {
            setUserName(userData.full_name)
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkUserRole()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-background border-r flex flex-col">
          <div className="p-4 border-b flex justify-center items-center">
            <Logo />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-background border-r flex flex-col">
        <div className="p-4 border-b flex justify-center items-center">
          <Logo />
        </div>

        <div className="p-4 border-b">
          <div className="font-medium">{userName}</div>
          <div className="text-sm text-muted-foreground">
            {companyName || "Osobní účet"}
          </div>
        </div>

        <nav className="flex-1 p-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mb-1",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Světlý
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Tmavý
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Systémový
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}