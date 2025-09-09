"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // The logic to fetch and apply the theme has been moved to the server-side
  // RootLayout to prevent Flash of Unstyled Content (FOUC).
  // This component now just wraps NextThemesProvider.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
