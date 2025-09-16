
import type { Metadata } from 'next';
import { getCeremonyById } from '@/lib/firebase/firestore';

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  const ceremony = await getCeremonyById(id);

  if (!ceremony) {
    return {
      title: 'Ceremonia no encontrada',
    };
  }
  
  const ogImage = ceremony.mediaUrl || 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';

  return {
    title: `${ceremony.title} | El Arte de Sanar`,
    description: ceremony.description,
    openGraph: {
      title: `${ceremony.title} | El Arte de Sanar`,
      description: ceremony.description,
      images: [
        {
          url: ogImage,
        },
      ],
    },
  };
}

export default function CeremonyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
