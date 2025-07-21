"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { getThemeSettings, ThemeSettings } from "@/lib/firebase/firestore"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    const applyCustomTheme = async () => {
      const settings = await getThemeSettings();
      if (settings) {
        const root = document.documentElement;
        
        // Light theme variables
        root.style.setProperty('--primary', settings.lightPrimary);
        root.style.setProperty('--background', settings.lightBackground);
        root.style.setProperty('--accent', settings.lightAccent);
        
        // Dark theme variables
        // We set these directly on the .dark selector's scope if needed, but for simplicity
        // we'll update the CSS variables that the .dark class uses from globals.css
        // This assumes globals.css has something like:
        // .dark { --primary: var(--dark-primary); }
        // Let's create specific variables for dark theme to avoid conflicts
        root.style.setProperty('--dark-primary', settings.darkPrimary);
        root.style.setProperty('--dark-background', settings.darkBackground);
        root.style.setProperty('--dark-accent', settings.darkAccent);
        
        // We also need to update the actual variables for the dark theme when it's active.
        // Let's just update the root variables, globals.css will handle the rest.
        const darkStyles = `
          .dark {
            --background: ${settings.darkBackground};
            --primary: ${settings.darkPrimary};
            --accent: ${settings.darkAccent};
          }
        `;
        const styleTag = document.createElement('style');
        styleTag.innerHTML = darkStyles;
        document.head.appendChild(styleTag);
      }
    };

    applyCustomTheme();
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
