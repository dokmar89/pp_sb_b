"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const logos = {
  dark: "/Logo_PassProve_bila.svg",
  light: "/Logo_PassProve_barvy.svg",
  system: "/Logo_PassProve_barvy.svg"
} as const

export function Logo({ className = "" }: { className?: string }) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`aspect-[3.75/1] w-full bg-muted animate-pulse rounded ${className}`} />
    )
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  const logoSrc = logos[currentTheme as keyof typeof logos] || logos.system

  return (
    <div className={`aspect-[3.75/1] ${className}`}>
      <Image
        src={logoSrc}
        alt="PassProve Logo"
        width={160}
        height={43}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
      {error && (
        <div className="text-sm text-destructive">Logo nelze načíst</div>
      )}
    </div>
  )
}
