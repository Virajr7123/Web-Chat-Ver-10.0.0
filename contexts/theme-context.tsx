"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    // Main app colors
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string

    // Sidebar specific colors
    sidebarBackground: string
    sidebarForeground: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarAccent: string
    sidebarAccentForeground: string
    sidebarBorder: string
    sidebarRing: string

    // Chat specific colors
    chatBackground?: string
    messageSent?: string
    messageSentText?: string
    messageReceived?: string
    messageReceivedText?: string
  }
}

const themes: Theme[] = [
  {
    id: "blue-default",
    name: "Blue Default",
    description: "Original blue theme - clean and professional",
    colors: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      popover: "240 10% 3.9%",
      popoverForeground: "0 0% 98%",
      primary: "217.2 91.2% 59.8%",
      primaryForeground: "0 0% 98%",
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      muted: "240 3.7% 15.9%",
      mutedForeground: "240 5% 64.9%",
      accent: "240 3.7% 15.9%",
      accentForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "217.2 91.2% 59.8%",
      sidebarBackground: "240 5.9% 10%",
      sidebarForeground: "240 4.8% 95.9%",
      sidebarPrimary: "217.2 91.2% 59.8%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "240 3.7% 15.9%",
      sidebarAccentForeground: "240 4.8% 95.9%",
      sidebarBorder: "240 3.7% 15.9%",
      sidebarRing: "217.2 91.2% 59.8%",
      chatBackground: "240 10% 3.9%",
      messageSent: "217.2 91.2% 59.8%",
      messageSentText: "0 0% 100%",
      messageReceived: "240 3.7% 15.9%",
      messageReceivedText: "0 0% 98%",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Sleek dark theme for low-light environments",
    colors: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      popover: "240 10% 3.9%",
      popoverForeground: "0 0% 98%",
      primary: "0 0% 98%",
      primaryForeground: "240 5.9% 10%",
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      muted: "240 3.7% 15.9%",
      mutedForeground: "240 5% 64.9%",
      accent: "240 3.7% 15.9%",
      accentForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "240 4.9% 83.9%",
      sidebarBackground: "240 5.9% 10%",
      sidebarForeground: "240 4.8% 95.9%",
      sidebarPrimary: "0 0% 98%",
      sidebarPrimaryForeground: "240 5.9% 10%",
      sidebarAccent: "240 3.7% 15.9%",
      sidebarAccentForeground: "240 4.8% 95.9%",
      sidebarBorder: "240 3.7% 15.9%",
      sidebarRing: "217.2 91.2% 59.8%",
    },
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Familiar WhatsApp-inspired design",
    colors: {
      background: "210 11% 96%",
      foreground: "0 0% 0%",
      card: "0 0% 100%",
      cardForeground: "0 0% 0%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 0%",
      primary: "142 70% 49%",
      primaryForeground: "0 0% 100%",
      secondary: "210 11% 96%",
      secondaryForeground: "0 0% 0%",
      muted: "210 11% 96%",
      mutedForeground: "0 0% 45%",
      accent: "142 70% 49%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "210 11% 91%",
      input: "210 11% 91%",
      ring: "142 70% 49%",
      sidebarBackground: "0 0% 100%",
      sidebarForeground: "0 0% 0%",
      sidebarPrimary: "142 70% 49%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "210 11% 96%",
      sidebarAccentForeground: "0 0% 0%",
      sidebarBorder: "210 11% 91%",
      sidebarRing: "142 70% 49%",
      chatBackground: "210 11% 96%",
      messageSent: "142 70% 49%",
      messageSentText: "0 0% 100%",
      messageReceived: "0 0% 100%",
      messageReceivedText: "0 0% 0%",
    },
  },
  {
    id: "whatsapp-dark",
    name: "WhatsApp Dark",
    description: "WhatsApp dark mode experience",
    colors: {
      background: "200 7% 8%",
      foreground: "0 0% 95%",
      card: "200 7% 12%",
      cardForeground: "0 0% 95%",
      popover: "200 7% 12%",
      popoverForeground: "0 0% 95%",
      primary: "142 70% 49%",
      primaryForeground: "0 0% 100%",
      secondary: "200 7% 17%",
      secondaryForeground: "0 0% 95%",
      muted: "200 7% 17%",
      mutedForeground: "0 0% 65%",
      accent: "142 70% 49%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "200 7% 17%",
      input: "200 7% 17%",
      ring: "142 70% 49%",
      sidebarBackground: "200 7% 12%",
      sidebarForeground: "0 0% 95%",
      sidebarPrimary: "142 70% 49%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "200 7% 17%",
      sidebarAccentForeground: "0 0% 95%",
      sidebarBorder: "200 7% 17%",
      sidebarRing: "142 70% 49%",
      chatBackground: "200 7% 8%",
      messageSent: "142 70% 49%",
      messageSentText: "0 0% 100%",
      messageReceived: "200 7% 17%",
      messageReceivedText: "0 0% 95%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    description: "Calming blue ocean-inspired theme",
    colors: {
      background: "210 100% 98%",
      foreground: "210 40% 15%",
      card: "210 100% 99%",
      cardForeground: "210 40% 15%",
      popover: "210 100% 99%",
      popoverForeground: "210 40% 15%",
      primary: "200 100% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "210 60% 95%",
      secondaryForeground: "210 40% 15%",
      muted: "210 60% 95%",
      mutedForeground: "210 20% 50%",
      accent: "195 100% 85%",
      accentForeground: "210 40% 15%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "210 40% 85%",
      input: "210 40% 85%",
      ring: "200 100% 50%",
      sidebarBackground: "210 60% 95%",
      sidebarForeground: "210 40% 15%",
      sidebarPrimary: "200 100% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "195 100% 85%",
      sidebarAccentForeground: "210 40% 15%",
      sidebarBorder: "210 40% 85%",
      sidebarRing: "200 100% 50%",
      chatBackground: "210 100% 98%",
      messageSent: "200 100% 50%",
      messageSentText: "0 0% 100%",
      messageReceived: "210 100% 99%",
      messageReceivedText: "210 40% 15%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Warm sunset colors with orange and purple hues",
    colors: {
      background: "30 100% 98%",
      foreground: "20 20% 15%",
      card: "30 100% 99%",
      cardForeground: "20 20% 15%",
      popover: "30 100% 99%",
      popoverForeground: "20 20% 15%",
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "30 60% 95%",
      secondaryForeground: "20 20% 15%",
      muted: "30 60% 95%",
      mutedForeground: "20 10% 50%",
      accent: "320 60% 85%",
      accentForeground: "20 20% 15%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "30 40% 85%",
      input: "30 40% 85%",
      ring: "25 95% 53%",
      sidebarBackground: "30 60% 95%",
      sidebarForeground: "20 20% 15%",
      sidebarPrimary: "25 95% 53%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "320 60% 85%",
      sidebarAccentForeground: "20 20% 15%",
      sidebarBorder: "30 40% 85%",
      sidebarRing: "25 95% 53%",
      chatBackground: "30 100% 98%",
      messageSent: "25 95% 53%",
      messageSentText: "0 0% 100%",
      messageReceived: "30 100% 99%",
      messageReceivedText: "20 20% 15%",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural green forest theme",
    colors: {
      background: "120 25% 98%",
      foreground: "120 15% 15%",
      card: "120 25% 99%",
      cardForeground: "120 15% 15%",
      popover: "120 25% 99%",
      popoverForeground: "120 15% 15%",
      primary: "142 76% 36%",
      primaryForeground: "0 0% 100%",
      secondary: "120 20% 95%",
      secondaryForeground: "120 15% 15%",
      muted: "120 20% 95%",
      mutedForeground: "120 10% 50%",
      accent: "100 50% 85%",
      accentForeground: "120 15% 15%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "120 20% 85%",
      input: "120 20% 85%",
      ring: "142 76% 36%",
      sidebarBackground: "120 20% 95%",
      sidebarForeground: "120 15% 15%",
      sidebarPrimary: "142 76% 36%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "100 50% 85%",
      sidebarAccentForeground: "120 15% 15%",
      sidebarBorder: "120 20% 85%",
      sidebarRing: "142 76% 36%",
      chatBackground: "120 25% 98%",
      messageSent: "142 76% 36%",
      messageSentText: "0 0% 100%",
      messageReceived: "120 25% 99%",
      messageReceivedText: "120 15% 15%",
    },
  },
  {
    id: "neon",
    name: "Neon Nights",
    description: "Vibrant neon colors for a futuristic look",
    colors: {
      background: "240 15% 5%",
      foreground: "0 0% 95%",
      card: "240 15% 8%",
      cardForeground: "0 0% 95%",
      popover: "240 15% 8%",
      popoverForeground: "0 0% 95%",
      primary: "300 100% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "240 10% 15%",
      secondaryForeground: "0 0% 95%",
      muted: "240 10% 15%",
      mutedForeground: "0 0% 65%",
      accent: "180 100% 50%",
      accentForeground: "240 15% 5%",
      destructive: "0 100% 50%",
      destructiveForeground: "0 0% 98%",
      border: "240 10% 20%",
      input: "240 10% 20%",
      ring: "300 100% 50%",
      sidebarBackground: "240 15% 8%",
      sidebarForeground: "0 0% 95%",
      sidebarPrimary: "300 100% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "240 10% 15%",
      sidebarAccentForeground: "0 0% 95%",
      sidebarBorder: "240 10% 20%",
      sidebarRing: "300 100% 50%",
      chatBackground: "240 15% 5%",
      messageSent: "300 100% 50%",
      messageSentText: "0 0% 100%",
      messageReceived: "240 15% 8%",
      messageReceivedText: "0 0% 95%",
    },
  },
  {
    id: "rose",
    name: "Rose Garden",
    description: "Elegant pink and rose theme",
    colors: {
      background: "350 100% 98%",
      foreground: "350 15% 15%",
      card: "350 100% 99%",
      cardForeground: "350 15% 15%",
      popover: "350 100% 99%",
      popoverForeground: "350 15% 15%",
      primary: "330 81% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "350 30% 95%",
      secondaryForeground: "350 15% 15%",
      muted: "350 30% 95%",
      mutedForeground: "350 10% 50%",
      accent: "320 50% 85%",
      accentForeground: "350 15% 15%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "350 20% 85%",
      input: "350 20% 85%",
      ring: "330 81% 60%",
      sidebarBackground: "350 30% 95%",
      sidebarForeground: "350 15% 15%",
      sidebarPrimary: "330 81% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "320 50% 85%",
      sidebarAccentForeground: "350 15% 15%",
      sidebarBorder: "350 20% 85%",
      sidebarRing: "330 81% 60%",
      chatBackground: "350 100% 98%",
      messageSent: "330 81% 60%",
      messageSentText: "0 0% 100%",
      messageReceived: "350 100% 99%",
      messageReceivedText: "350 15% 15%",
    },
  },
]

interface ThemeContextType {
  currentTheme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]) // Blue Default is now first

  useEffect(() => {
    // Load saved theme from localStorage
    const savedThemeId = localStorage.getItem("chat-theme")
    if (savedThemeId) {
      const savedTheme = themes.find((theme) => theme.id === savedThemeId)
      if (savedTheme) {
        setCurrentTheme(savedTheme)
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })
  }, [currentTheme])

  const setTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      localStorage.setItem("chat-theme", themeId)
    }
  }

  return <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
