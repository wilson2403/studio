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

const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';

export const metadata: Metadata = {
  title: 'El Arte de Sanar 🌿 Ceremonias de Medicina Ancestral en Costa Rica',
  description:
    'Explora un viaje profundo del alma en ceremonias guiadas con sabiduría amazónica. Conexión, sanación y transformación espiritual en Costa Rica.',
  keywords: 'ayahuasca, ceremonia de ayahuasca, medicina ancestral, sanación espiritual, retiro espiritual, el arte de sanar, costa rica',
  openGraph: {
    title: 'El Arte de Sanar 🌿 Ceremonias de Medicina Ancestral en Costa Rica',
    description: 'Explora un viaje profundo del alma en ceremonias guiadas con sabiduría amazónica. Conexión, sanación y transformación espiritual en Costa Rica.',
    images: [
      {
        url: ogImage,
        width: 800,
        height: 600,
        alt: 'El Arte de Sanar',
      },
    ],
    url: 'https://artedesanar.vercel.app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'El Arte de Sanar 🌿 Ceremonias de Medicina Ancestral',
    description: 'Un espacio sagrado para tu sanación interior y conexión espiritual.',
    images: [ogImage],
  },
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
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-8C56RV74XL"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-8C56RV74XL');
            `,
          }}
        />
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
