
'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { getPastCeremonies, PastCeremony, seedPastCeremonies } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { EditableTitle } from './EditableTitle';

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    videoId = match[1];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0` : null;
}

function getStreamableEmbedUrl(url: string): string | null {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://streamable.com/e/${match[1]}?autoplay=1&muted=1&loop=1`;
  }
  return null;
}

const VideoPlayer = ({ video, isHovered }: { video: PastCeremony, isHovered: boolean }) => {
    const streamableEmbedUrl = getStreamableEmbedUrl(video.videoUrl);
    const youtubeEmbedUrl = getYouTubeEmbedUrl(video.videoUrl);

    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        if (videoRef.current) {
            if (isHovered) {
                videoRef.current.play().catch(e => console.error("Play failed", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isHovered]);


    if (streamableEmbedUrl) {
    return (
        <iframe
        src={streamableEmbedUrl}
        frameBorder="0"
        allow="autoplay; muted; loop"
        allowFullScreen
        className="w-full h-full object-cover"
        ></iframe>
    );
    }
    
    if (youtubeEmbedUrl) {
        return (
           <iframe
            src={youtubeEmbedUrl}
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
            key={video.videoUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={video.videoUrl}
        ></video>
    );
}

export default function PastCeremonies() {
    const { t } = useTranslation();
    const [videos, setVideos] = React.useState<PastCeremony[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hoveredVideo, setHoveredVideo] = React.useState<string | null>(null);

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
        <section id="past-ceremonies" className="container py-12 md:py-24">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                    tag="h2"
                    id="pastCeremoniesTitle"
                    initialValue={t('pastCeremoniesTitle')}
                    className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="aspect-video rounded-2xl bg-card animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {videos.map((video) => (
                            <CarouselItem key={video.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <div
                                    className="relative rounded-2xl overflow-hidden aspect-video group"
                                    onMouseEnter={() => setHoveredVideo(video.id)}
                                    onMouseLeave={() => setHoveredVideo(null)}
                                >
                                    <VideoPlayer video={video} isHovered={hoveredVideo === video.id}/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-all duration-300"></div>
                                    <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white transition-all duration-300 transform-gpu translate-y-1/4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 text-left">
                                        <h3 className="text-lg md:text-xl font-headline">{video.title}</h3>
                                        <p className="font-body text-sm opacity-90 mt-1">{video.description}</p>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>
            )}
        </section>
    );
}
