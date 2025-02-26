"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, CreditCard, HelpCircle, Settings, Store, PenToolIcon as Tool } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart,
  },
  {
    title: "Účet a platby",
    href: "/dashboard/account",
    icon: CreditCard,
  },
  {
    title: "Eshopy",
    href: "/dashboard/shops",
    icon: Store,
  },
  {
    title: "Přizpůsobení",
    href: "/dashboard/customize",
    icon: Settings,
  },
  {
    title: "Podpora",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
  {
    title: "Instalace",
    href: "/dashboard/installation",
    icon: Tool,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Věková verifikace</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

