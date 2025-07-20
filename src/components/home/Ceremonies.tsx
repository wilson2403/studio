'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Edit, PlusCircle, Copy, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCeremonies, Ceremony, seedCeremonies } from '@/lib/firebase/firestore';
import EditCeremonyDialog from './EditCeremonyDialog';
import { EditableTitle } from './EditableTitle';
import Script from 'next/script';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    videoId = match[1];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function getTikTokEmbedData(url: string): { embedUrl: string; videoId: string } | null {
  if (!url) return null;
  const tiktokRegex = /tiktok\.com\/.*\/video\/(\d+)/;
  const match = url.match(tiktokRegex);
  if (match && match[1]) {
    const videoId = match[1];
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      videoId: videoId
    };
  }
  return null;
}


const MediaPreview = ({ mediaUrl, mediaType, title }: { mediaUrl?: string, mediaType?: 'image' | 'video', title: string }) => {
  if (!mediaUrl) {
    return <Image src='https://placehold.co/600x400.png' alt={title} width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint="spiritual ceremony" />;
  }
  
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);
  const tiktokData = getTikTokEmbedData(mediaUrl);

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full object-cover"
      ></iframe>
    );
  }
  
  if (tiktokData) {
    return (
       <blockquote
          className="tiktok-embed w-full h-full"
          cite={mediaUrl}
          data-video-id={tiktokData.videoId}
          style={{ maxWidth: '605px', minHeight: '325px' }}
        >
          <section>
            <a target="_blank" title={title} href={mediaUrl}>
              {title}
            </a>
          </section>
        </blockquote>
    );
  }


  if (mediaType === 'video' && mediaUrl.match(/\.(mp4|webm)$/)) {
     return <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
  }

  return <Image src={mediaUrl} alt={title} width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint="spiritual event" />;
};


export default function Ceremonies() {
  const [user, setUser] = useState<User | null>(null);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCeremonies = async () => {
      setLoading(true);
      try {
        let ceremoniesData = await getCeremonies();
        if (ceremoniesData.length === 0) {
          console.log('No ceremonies found, seeding database...');
          await seedCeremonies();
          ceremoniesData = await getCeremonies();
        }
        setCeremonies(ceremoniesData);
      } catch (error) {
        console.error("Failed to fetch or seed ceremonies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCeremonies();
  }, []);

  const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
    setCeremonies(ceremonies.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
    setEditingCeremony(null);
  };
  
  const handleCeremonyAdd = (newCeremony: Ceremony) => {
    setCeremonies([...ceremonies, newCeremony]);
    setIsAdding(false);
  }

  const handleCeremonyDelete = (id: string) => {
    setCeremonies(ceremonies.filter(c => c.id !== id));
    setEditingCeremony(null);
  }
  
  const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
     setCeremonies([...ceremonies, newCeremony]);
  }

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <section id="ceremonias" className="container py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
             <Card key={i} className="flex flex-col rounded-2xl border-2 border-card-foreground/10 h-[550px] animate-pulse bg-card/50"></Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
    <Script async src="https://www.tiktok.com/embed.js"></Script>
    <section
      id="ceremonias"
      className="container py-12 md:py-24 animate-in fade-in-0 duration-1000 delay-500"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <EditableTitle
          tag="h2"
          id="upcomingCeremoniesTitle"
          initialValue="Próximas Ceremonias"
          className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
        />
        <EditableTitle
          tag="p"
          id="upcomingCeremoniesSubtitle"
          initialValue="Estos son nuestros próximos encuentros. Cada uno es una oportunidad única para sanar y reconectar."
          className="max-w-2xl text-lg text-foreground/80 font-body"
         />
         {isAdmin && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2" />
            Añadir Ceremonia
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ceremonies.map((ceremony) => (
          <Card
            key={ceremony.id}
            className={`relative flex flex-col rounded-2xl border-2 hover:border-primary/80 transition-all duration-300 group overflow-hidden ${
              ceremony.featured
                ? 'border-primary shadow-[0_0_30px_-10px] shadow-primary/50'
                : 'border-card-foreground/10'
            }`}
          >
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-10 bg-black/50 hover:bg-black/80"
                onClick={() => setEditingCeremony(ceremony)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
             <CardHeader className="p-0">
               <div className="aspect-video overflow-hidden">
                <MediaPreview mediaUrl={ceremony.mediaUrl} mediaType={ceremony.mediaType} title={ceremony.title} />
               </div>
            </CardHeader>
            <div className="p-6 flex flex-col flex-1">
              <CardTitle className="text-2xl font-headline tracking-wide">
                {ceremony.title}
              </CardTitle>
              <CardDescription className="font-body text-base mt-2">
                {ceremony.description}
              </CardDescription>
            <CardContent className="flex-1 space-y-6 mt-6 p-0">
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">
                  {ceremony.price}
                </span>
                <p className="text-sm text-muted-foreground">
                  hasta 100.000 plan completo
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-bold">
                  <Check className="h-5 w-5 text-primary" />
                  <span>🍲 Incluye:</span>
                </li>
                {ceremony.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 ml-4">
                    <Check className="h-5 w-5 text-primary/70" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0 pt-6">
              <Button
                asChild
                className={`w-full text-lg font-bold rounded-xl h-12 ${
                  ceremony.featured
                    ? 'bg-gradient-to-r from-primary via-fuchsia-500 to-purple-500 text-primary-foreground hover:opacity-90'
                    : ''
                }`}
                variant={ceremony.featured ? 'default' : 'outline'}
              >
                <Link
                  href={ceremony.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reservar Cupo
                </Link>
              </Button>
            </CardFooter>
            </div>
          </Card>
        ))}
      </div>
      {(editingCeremony || isAdding) && (
        <EditCeremonyDialog
          ceremony={editingCeremony}
          isOpen={!!editingCeremony || isAdding}
          onClose={() => {
            setEditingCeremony(null);
            setIsAdding(false);
          }}
          onUpdate={handleCeremonyUpdate}
          onAdd={handleCeremonyAdd}
          onDelete={handleCeremonyDelete}
          onDuplicate={handleCeremonyDuplicate}
        />
      )}
    </section>
    </>
  );
}
