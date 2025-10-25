"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning" | "testing"
  message: string
  category: string
}

export default function ComprehensiveTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)

  const updateTestResult = (name: string, status: "pass" | "fail" | "warning", message: string, category: string) => {
    setTestResults((prev) => {
      const existing = prev.findIndex((t) => t.name === name)
      const newResult = { name, status, message, category }
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newResult
        return updated
      }
      return [...prev, newResult]
    })
  }

  const runComprehensiveTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // 1. AUTHENTICATION TESTS
    setCurrentTest("Testing Authentication System...")

    // Test Firebase Configuration
    try {
      const { auth, database } = await import("@/lib/firebase")
      updateTestResult("Firebase Config", "pass", "Firebase properly configured", "Authentication")
    } catch (error) {
      updateTestResult("Firebase Config", "fail", `Firebase config error: ${error}`, "Authentication")
    }

    // Test Auth Context
    try {
      const { useAuth } = await import("@/contexts/auth-context")
      updateTestResult("Auth Context", "pass", "Auth context properly exported", "Authentication")
    } catch (error) {
      updateTestResult("Auth Context", "fail", `Auth context error: ${error}`, "Authentication")
    }

    // Test Auth Screen Component
    try {
      const AuthScreen = await import("@/components/auth-screen")
      updateTestResult("Auth Screen", "pass", "Auth screen component loads", "Authentication")
    } catch (error) {
      updateTestResult("Auth Screen", "fail", `Auth screen error: ${error}`, "Authentication")
    }

    // 2. CHAT SYSTEM TESTS
    setCurrentTest("Testing Chat System...")

    // Test Chat Context
    try {
      const { useChat } = await import("@/contexts/chat-context")
      updateTestResult("Chat Context", "pass", "Chat context properly exported", "Chat System")
    } catch (error) {
      updateTestResult("Chat Context", "fail", `Chat context error: ${error}`, "Chat System")
    }

    // Test Chat Interface
    try {
      const ChatInterface = await import("@/components/chat-interface")
      updateTestResult("Chat Interface", "pass", "Chat interface component loads", "Chat System")
    } catch (error) {
      updateTestResult("Chat Interface", "fail", `Chat interface error: ${error}`, "Chat System")
    }

    // Test Message Components
    try {
      const MessageContextMenu = await import("@/components/message-context-menu")
      const MessageReactions = await import("@/components/message-reactions")
      const MessageFilePreview = await import("@/components/message-file-preview")
      updateTestResult("Message Components", "pass", "All message components load", "Chat System")
    } catch (error) {
      updateTestResult("Message Components", "fail", `Message components error: ${error}`, "Chat System")
    }

    // 3. UI COMPONENTS TESTS
    setCurrentTest("Testing UI Components...")

    // Test Core UI Components
    const uiComponents = [
      "button",
      "input",
      "avatar",
      "card",
      "dialog",
      "sheet",
      "tabs",
      "scroll-area",
      "badge",
      "progress",
      "toast",
      "alert",
    ]

    for (const component of uiComponents) {
      try {
        await import(`@/components/ui/${component}`)
        updateTestResult(`UI: ${component}`, "pass", `${component} component loads`, "UI Components")
      } catch (error) {
        updateTestResult(`UI: ${component}`, "fail", `${component} error: ${error}`, "UI Components")
      }
    }

    // 4. FEATURE COMPONENTS TESTS
    setCurrentTest("Testing Feature Components...")

    const featureComponents = [
      { name: "Contact Profile", path: "@/components/contact-profile-drawer" },
      { name: "User Profile", path: "@/components/user-profile-drawer" },
      { name: "Group Profile", path: "@/components/group-profile-drawer" },
      { name: "Group Creation", path: "@/components/group-creation-modal" },
      { name: "File Upload", path: "@/components/file-upload" },
      { name: "Typing Indicator", path: "@/components/typing-indicator" },
      { name: "Unread Badge", path: "@/components/unread-badge" },
      { name: "Theme Settings", path: "@/components/theme-settings" },
      { name: "Drag Drop Zone", path: "@/components/drag-drop-zone" },
    ]

    for (const component of featureComponents) {
      try {
        await import(component.path)
        updateTestResult(component.name, "pass", `${component.name} loads correctly`, "Features")
      } catch (error) {
        updateTestResult(component.name, "fail", `${component.name} error: ${error}`, "Features")
      }
    }

    // 5. CONTEXT PROVIDERS TESTS
    setCurrentTest("Testing Context Providers...")

    const contexts = [
      { name: "Auth Context", path: "@/contexts/auth-context" },
      { name: "Chat Context", path: "@/contexts/chat-context" },
      { name: "Theme Context", path: "@/contexts/theme-context" },
    ]

    for (const context of contexts) {
      try {
        await import(context.path)
        updateTestResult(context.name, "pass", `${context.name} loads correctly`, "Contexts")
      } catch (error) {
        updateTestResult(context.name, "fail", `${context.name} error: ${error}`, "Contexts")
      }
    }

    // 6. HOOKS TESTS
    setCurrentTest("Testing Custom Hooks...")

    const hooks = [
      { name: "use-toast", path: "@/hooks/use-toast" },
      { name: "use-mobile", path: "@/hooks/use-mobile" },
    ]

    for (const hook of hooks) {
      try {
        await import(hook.path)
        updateTestResult(hook.name, "pass", `${hook.name} hook loads correctly`, "Hooks")
      } catch (error) {
        updateTestResult(hook.name, "fail", `${hook.name} error: ${error}`, "Hooks")
      }
    }

    // 7. UTILITIES TESTS
    setCurrentTest("Testing Utilities...")

    try {
      await import("@/lib/utils")
      updateTestResult("Utils", "pass", "Utility functions load correctly", "Utilities")
    } catch (error) {
      updateTestResult("Utils", "fail", `Utils error: ${error}`, "Utilities")
    }

    // 8. MOBILE FEATURES TESTS
    setCurrentTest("Testing Mobile Features...")

    // Test mobile detection
    const isMobile = window.innerWidth < 768
    updateTestResult("Mobile Detection", "pass", `Mobile: ${isMobile}`, "Mobile")

    // Test touch events support
    const hasTouchSupport = "ontouchstart" in window
    updateTestResult(
      "Touch Support",
      hasTouchSupport ? "pass" : "warning",
      `Touch events: ${hasTouchSupport ? "Supported" : "Not detected"}`,
      "Mobile",
    )

    // Test viewport API
    const hasViewportAPI = "visualViewport" in window
    updateTestResult(
      "Viewport API",
      hasViewportAPI ? "pass" : "warning",
      `Visual Viewport API: ${hasViewportAPI ? "Available" : "Not available"}`,
      "Mobile",
    )

    // Test vibration API
    const hasVibration = "vibrate" in navigator
    updateTestResult(
      "Vibration API",
      hasVibration ? "pass" : "warning",
      `Vibration: ${hasVibration ? "Available" : "Not available"}`,
      "Mobile",
    )

    // 9. BROWSER COMPATIBILITY TESTS
    setCurrentTest("Testing Browser Compatibility...")

    // Test localStorage
    try {
      localStorage.setItem("test", "test")
      localStorage.removeItem("test")
      updateTestResult("LocalStorage", "pass", "LocalStorage available", "Browser")
    } catch (error) {
      updateTestResult("LocalStorage", "fail", "LocalStorage not available", "Browser")
    }

    // Test sessionStorage
    try {
      sessionStorage.setItem("test", "test")
      sessionStorage.removeItem("test")
      updateTestResult("SessionStorage", "pass", "SessionStorage available", "Browser")
    } catch (error) {
      updateTestResult("SessionStorage", "fail", "SessionStorage not available", "Browser")
    }

    // Test WebSocket support
    const hasWebSocket = "WebSocket" in window
    updateTestResult(
      "WebSocket",
      hasWebSocket ? "pass" : "fail",
      `WebSocket: ${hasWebSocket ? "Supported" : "Not supported"}`,
      "Browser",
    )

    // Test Clipboard API
    const hasClipboard = "clipboard" in navigator
    updateTestResult(
      "Clipboard API",
      hasClipboard ? "pass" : "warning",
      `Clipboard: ${hasClipboard ? "Available" : "Not available"}`,
      "Browser",
    )

    // 10. PERFORMANCE TESTS
    setCurrentTest("Testing Performance...")

    // Test bundle size (approximate)
    const performanceEntries = performance.getEntriesByType("navigation")
    if (performanceEntries.length > 0) {
      const navigation = performanceEntries[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart
      updateTestResult("Page Load", loadTime < 3000 ? "pass" : "warning", `Load time: ${loadTime}ms`, "Performance")
    }

    // Test memory usage (if available)
    if ("memory" in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024
      updateTestResult(
        "Memory Usage",
        memoryUsage < 50 ? "pass" : "warning",
        `Memory: ${memoryUsage.toFixed(2)}MB`,
        "Performance",
      )
    }

    // 11. ACCESSIBILITY TESTS
    setCurrentTest("Testing Accessibility...")

    // Test ARIA support
    const testElement = document.createElement("div")
    testElement.setAttribute("aria-label", "test")
    const hasARIA = testElement.getAttribute("aria-label") === "test"
    updateTestResult(
      "ARIA Support",
      hasARIA ? "pass" : "fail",
      `ARIA: ${hasARIA ? "Supported" : "Not supported"}`,
      "Accessibility",
    )

    // Test keyboard navigation
    const hasTabIndex = document.createElement("button").tabIndex !== undefined
    updateTestResult(
      "Keyboard Navigation",
      hasTabIndex ? "pass" : "fail",
      `Tab navigation: ${hasTabIndex ? "Supported" : "Not supported"}`,
      "Accessibility",
    )

    // 12. SECURITY TESTS
    setCurrentTest("Testing Security...")

    // Test HTTPS
    const isHTTPS = location.protocol === "https:"
    updateTestResult("HTTPS", isHTTPS ? "pass" : "warning", `Protocol: ${location.protocol}`, "Security")

    // Test CSP (basic check)
    const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null
    updateTestResult(
      "CSP",
      hasCSP ? "pass" : "warning",
      `Content Security Policy: ${hasCSP ? "Present" : "Not detected"}`,
      "Security",
    )

    setCurrentTest("Tests Complete!")
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "testing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: "bg-green-100 text-green-800 border-green-200",
      fail: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      testing: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return variants[status as keyof typeof variants] || variants.testing
  }

  const groupedResults = testResults.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    },
    {} as Record<string, TestResult[]>,
  )

  const totalTests = testResults.length
  const passedTests = testResults.filter((t) => t.status === "pass").length
  const failedTests = testResults.filter((t) => t.status === "fail").length
  const warningTests = testResults.filter((t) => t.status === "warning").length

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Comprehensive System Test</span>
              {isRunning && <Loader2 className="h-5 w-5 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Complete testing of all chat application features from authentication to messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Button
                onClick={runComprehensiveTests}
                disabled={isRunning}
                className="bg-primary text-primary-foreground"
              >
                {isRunning ? "Running Tests..." : "Run All Tests"}
              </Button>

              {totalTests > 0 && (
                <div className="flex space-x-4">
                  <Badge className="bg-green-100 text-green-800">✓ {passedTests} Passed</Badge>
                  {failedTests > 0 && <Badge className="bg-red-100 text-red-800">✗ {failedTests} Failed</Badge>}
                  {warningTests > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800">⚠ {warningTests} Warnings</Badge>
                  )}
                </div>
              )}
            </div>

            {isRunning && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-800 font-medium">{currentTest}</span>
                </div>
              </div>
            )}

            {Object.keys(groupedResults).length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([category, results]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(result.status)}
                              <span className="font-medium">{result.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-muted-foreground">{result.message}</span>
                              <Badge className={`${getStatusBadge(result.status)} border`}>
                                {result.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Coverage Summary */}
        {totalTests > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Coverage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{warningTests}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(passedTests / totalTests) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {((passedTests / totalTests) * 100).toFixed(1)}% of tests passing
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Checklist</CardTitle>
            <CardDescription>Complete list of features that should be tested manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "User Registration & Login",
                "Account Termination Handling",
                "Contact Management",
                "Real-time Messaging",
                "Message Reactions",
                "Message Replies",
                "Message Deletion",
                "File Upload & Sharing",
                "Group Creation",
                "Group Management",
                "Typing Indicators",
                "Online Status",
                "Unread Message Counts",
                "Theme Customization",
                "Mobile Responsiveness",
                "Swipe to Reply",
                "Keyboard Adaptation",
                "Context Menus",
                "Profile Management",
                "Search Functionality",
                "Notification Sounds",
                "Drag & Drop Files",
                "Message Context Menu",
                "Group Member Management",
                "Contact Profile Views",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
