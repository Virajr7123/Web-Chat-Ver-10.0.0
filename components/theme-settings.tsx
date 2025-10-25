"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Palette } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { motion } from "framer-motion"

export default function ThemeSettings() {
  const { currentTheme, setTheme, themes } = useTheme()
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null)

  const getThemePreview = (theme: any) => {
    return (
      <div className="flex space-x-1 h-8 w-full rounded overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: `hsl(${theme.colors.sidebarBackground})` }} />
        <div className="flex-[2]" style={{ backgroundColor: `hsl(${theme.colors.background})` }} />
        <div className="w-4" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Palette className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Choose Theme</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Customize your chat experience with beautiful themes. Each theme changes the colors throughout the app.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {themes.map((theme) => (
          <motion.div
            key={theme.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredTheme(theme.id)}
            onHoverEnd={() => setHoveredTheme(null)}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                currentTheme.id === theme.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
              } ${hoveredTheme === theme.id ? "shadow-lg" : ""}`}
              onClick={() => setTheme(theme.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border">{getThemePreview(theme)}</div>
                    <div>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <span>{theme.name}</span>
                        {currentTheme.id === theme.id && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">{theme.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Preview</div>
                  <div className="rounded-lg border overflow-hidden">
                    {/* Chat preview */}
                    <div className="p-3 border-b" style={{ backgroundColor: `hsl(${theme.colors.sidebarBackground})` }}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        />
                        <div
                          className="text-xs font-medium"
                          style={{ color: `hsl(${theme.colors.sidebarForeground})` }}
                        >
                          Contact Name
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 space-y-2"
                      style={{ backgroundColor: `hsl(${theme.colors.chatBackground || theme.colors.background})` }}
                    >
                      {/* Received message */}
                      <div className="flex justify-start">
                        <div
                          className="px-3 py-1 rounded-lg text-xs max-w-[70%]"
                          style={{
                            backgroundColor: `hsl(${theme.colors.messageReceived || theme.colors.card})`,
                            color: `hsl(${theme.colors.messageReceivedText || theme.colors.cardForeground})`,
                          }}
                        >
                          Hey there! 👋
                        </div>
                      </div>

                      {/* Sent message */}
                      <div className="flex justify-end">
                        <div
                          className="px-3 py-1 rounded-lg text-xs max-w-[70%]"
                          style={{
                            backgroundColor: `hsl(${theme.colors.messageSent || theme.colors.primary})`,
                            color: `hsl(${theme.colors.messageSentText || theme.colors.primaryForeground})`,
                          }}
                        >
                          Hello! How are you?
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Current Theme</h4>
            <p className="text-sm text-muted-foreground">{currentTheme.name}</p>
          </div>
          <Button variant="outline" onClick={() => setTheme("default")} disabled={currentTheme.id === "default"}>
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  )
}
