'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  getPastCeremonies,
  PastCeremony,
  seedPastCeremonies,
} from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useTranslation } from 'react-i18next';
import { EditableTitle } from './EditableTitle';

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

const VideoPlayer = ({ video, isAdmin }: { video: PastCeremony, isAdmin: boolean }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(video.videoUrl);

  const handleMouseEnter = () => {
    if(videoRef.current) {
        videoRef.current.play().catch(e => console.log("Video play failed:", e));
    }
  };

  const handleMouseLeave = () => {
    if(videoRef.current) {
        videoRef.current.pause();
    }
  };

  if (youtubeEmbedUrl) {
    return (
       <iframe
        src={youtubeEmbedUrl + (isAdmin ? '' : '?autoplay=0&mute=1&controls=0&loop=1')}
        title={video.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      ></iframe>
    )
  }

  return (
    <video
      ref={videoRef}
      src={video.videoUrl}
      playsInline
      loop
      muted
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};


export default function PastCeremonies() {
  const [videos, setVideos] = React.useState<PastCeremony[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const { t } = useTranslation();

  const isAdmin = user?.email === ADMIN_EMAIL;

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let data = await getPastCeremonies();
      if (data.length === 0) {
        await seedPastCeremonies();
        data = await getPastCeremonies();
      }
      setVideos(data);
      setLoading(false);
    };
    fetchVideos();
  }, []);
  
  return (
    <section className="container py-12 md:py-24">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <EditableTitle
          tag="h2"
          id="pastCeremoniesTitle"
          initialValue={t('pastCeremoniesTitle')}
          className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
        />
        <EditableTitle
          tag="p"
          id="pastCeremoniesSubtitle"
          initialValue={t('pastCeremoniesSubtitle')}
          className="max-w-2xl text-lg text-foreground/80 font-body"
        />
      </div>

       {loading ? (
        <div className="flex justify-center">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-1">
                        <div className="relative rounded-2xl overflow-hidden aspect-video group bg-card/50 animate-pulse"></div>
                    </div>
                 ))}
            </div>
        </div>
      ) : (
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div className="relative rounded-2xl overflow-hidden aspect-video group">
                  <VideoPlayer video={video} isAdmin={isAdmin} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-all duration-300"></div>
                   <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white transition-all duration-300 transform-gpu translate-y-1/4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                      <h3 className="text-lg md:text-xl font-headline">{video.title}</h3>
                      <p className="font-body text-sm opacity-90 mt-1">{video.description}</p>
                   </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex"/>
      </Carousel>
      )}
    </section>
  );
}
