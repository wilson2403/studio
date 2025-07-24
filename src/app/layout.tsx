import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { I18nProvider } from '@/components/layout/I18nProvider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import Chatbot from '@/components/chat/Chatbot';
import { EditableProvider } from '@/components/home/EditableProvider';
import LoadingScreen from '@/components/layout/LoadingScreen';

export const metadata: Metadata = {
  title: 'El Arte de Sanar - Un Encuentro Sagrado con Medicinas Ancestrales',
  description:
    'Descubre cómo la Ayahuasca puede transformar tu vida. Únete a nuestras ceremonias guiadas por expertos para una sanación profunda y una renovada conexión espiritual.',
  keywords: 'ayahuasca, ceremonia de ayahuasca, medicina ancestral, sanación espiritual, retiro espiritual, el arte de sanar',
  other: {
    'google-site-verification': '3ikN5R9KIadbh6RorKv3LtApl6c-M0tEqmdqHuuN_Wk',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn('min-h-screen bg-background font-body antialiased')}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
            <LoadingScreen />
            <I18nProvider>
                <EditableProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                    <Chatbot />
                  </div>
                  <Toaster />
                  <div id="fb-root"></div>
                  <Script
                    id="facebook-sdk"
                    strategy="lazyOnload"
                    src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v20.0&appId=YOUR_APP_ID"
                  />
                </EditableProvider>
            </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
