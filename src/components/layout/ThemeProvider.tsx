"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { getThemeSettings, ThemeSettings } from "@/lib/firebase/firestore"

function applyTheme(settings: ThemeSettings) {
  const existingStyleTag = document.getElementById('dynamic-theme-styles');
  if (existingStyleTag) {
    existingStyleTag.remove();
  }

  const style = document.createElement('style');
  style.id = 'dynamic-theme-styles';
  style.innerHTML = `
    :root {
      --light-primary: ${settings.lightPrimary};
      --light-background: ${settings.lightBackground};
      --light-accent: ${settings.lightAccent};
    }
    .dark {
      --dark-primary: ${settings.darkPrimary};
      --dark-background: ${settings.darkBackground};
      --dark-accent: ${settings.darkAccent};
    }
  `;
  document.head.appendChild(style);
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    const applyInitialTheme = async () => {
      const settings = await getThemeSettings();
      if (settings) {
        applyTheme(settings);
      }
    };

    applyInitialTheme();
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
