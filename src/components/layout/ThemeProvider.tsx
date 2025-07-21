"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { getThemeSettings, ThemeSettings } from "@/lib/firebase/firestore"

function applyDynamicTheme(settings: ThemeSettings) {
  const styleId = 'dynamic-theme-styles';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  
  const lightStyles = settings.light 
    ? Object.entries(settings.light)
        .map(([key, value]) => `--light-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
        .join('\n')
    : '';

  const darkStyles = settings.dark
    ? Object.entries(settings.dark)
        .map(([key, value]) => `--dark-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
        .join('\n')
    : '';

  styleTag.innerHTML = `:root { ${lightStyles} ${darkStyles} }`;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    const fetchAndApplyTheme = async () => {
      const settings = await getThemeSettings();
      if (settings) {
        applyDynamicTheme(settings);
      }
    };

    fetchAndApplyTheme();
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}