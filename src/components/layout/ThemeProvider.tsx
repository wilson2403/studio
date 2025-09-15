"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { getThemeSettings, getPredefinedThemes } from "@/lib/firebase/firestore"

function applyTheme(settings: any) {
  if (!settings || !settings.light || !settings.dark) {
    console.warn("applyTheme called with invalid settings.");
    return;
  }
  const styleId = 'dynamic-theme-styles';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  
  const lightStyles = Object.entries(settings.light)
    .map(([key, value]) => `--light-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');

  const darkStyles = Object.entries(settings.dark)
    .map(([key, value]) => `--dark-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');
    
  styleTag.innerHTML = `:root { ${lightStyles} ${darkStyles} }`;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    React.useEffect(() => {
        const fetchAndApplyTheme = async () => {
            const activeThemeId = localStorage.getItem('activeThemeId');
            if (activeThemeId) {
                 const themes = await getPredefinedThemes();
                 const activeTheme = themes.find(t => t.id === activeThemeId);
                 if (activeTheme) {
                     applyTheme(activeTheme.colors);
                 }
            } else {
                const themeSettings = await getThemeSettings();
                if (themeSettings) {
                    applyTheme(themeSettings);
                }
            }
        };
        fetchAndApplyTheme();
    }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
