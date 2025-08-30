
import HomePageContent from '@/components/home/HomePageContent';
import type { Metadata } from 'next';
import i18next from 'i18next';
import { getSystemSettings } from '@/ai/flows/settings-flow';

const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSystemSettings();
    
    // Determine language from i18next or default to 'es'
    const lang = i18next.language || 'es';

    const title = settings?.ogTitle?.[lang as keyof typeof settings.ogTitle] || 'El Arte de Sanar 🌿 | Ceremonias de Medicina Ancestral en Costa Rica';
    const description = settings?.ogDescription?.[lang as keyof typeof settings.ogDescription] || 'Explora un viaje profundo del alma en ceremonias guiadas con sabiduría amazónica en Costa Rica.';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: "https://artedesanar.vercel.app",
            siteName: "El Arte de Sanar",
            images: [
                {
                    url: ogImage,
                    width: 800,
                    height: 600,
                    alt: 'El Arte de Sanar',
                },
            ],
            type: "website",
            locale: "es_CR",
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}


export default function Home() {
  return <HomePageContent />;
}
