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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"

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
    href: "/dashboard/account",
    icon: User
  },
  {
    title: "Fakturace",
    href: "/dashboard/billing",
    icon: CreditCard
  },
  {
    title: "Eshopy",
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
    href: "/dashboard/support",
    icon: HelpCircle
  },
  {
    title: "Instalace",
    href: "/dashboard/installation",
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
  const [userAvatar, setUserAvatar] = useState<string>("")

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

          // Načteme avatar uživatele
          const { data: avatarData, error: avatarError } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", session.user.id)
            .maybeSingle()

          if (avatarError) {
            console.error("Error fetching avatar:", avatarError)
          } else if (avatarData?.avatar_url) {
            setUserAvatar(avatarData.avatar_url)
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
        <div className="w-72 bg-card border-r border-border flex flex-col">
          <div className="h-40 flex items-center justify-center border-b border-border">
            <div className="flex items-center justify-center w-full px-6">
              <Logo className="w-full h-auto max-w-[160px]" />
            </div>
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
      <div className="w-64 bg-background border-r border-border/40 flex flex-col">
        <div className="h-40 flex items-center justify-center border-b border-border/40">
          <div className="flex items-center justify-center w-full px-6">
            <Logo className="w-full h-auto max-w-[160px]" />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} />
              <AvatarFallback className="text-xs font-medium">
                {userName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {companyName || "Osobní účet"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 text-sm transition-colors rounded-md",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}