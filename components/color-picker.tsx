"use client"

import type React from "react"

import { forwardRef } from "react"

import { Input } from "@/components/ui/input"

interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string
  onChange?: (value: string) => void
}

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(({ value, onChange, ...props }, ref) => {
  return (
    <div className="flex gap-2">
      <Input
        type="color"
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-20 cursor-pointer"
        {...props}
      />
      <Input type="text" value={value} onChange={(e) => onChange?.(e.target.value)} className="font-mono" {...props} />
    </div>
  )
})
ColorPicker.displayName = "ColorPicker"

