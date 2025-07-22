
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Pause, Play, Volume2, VolumeX, Maximize, Loader } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  title: string;
  className?: string;
  controls?: boolean;
  isActivated?: boolean;
  inCarousel?: boolean;
}

const getYoutubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : null;
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: '0', // Changed to 0
    loop: '1',
    controls: '1',
    playlist: videoId,
    mute: '0',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const videoId = url.split('video/')[1]?.split('?')[0];
    if (!videoId) return null;
    // Set autoplay to 0 to give user control over sound
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0&loop=1&controls=1&mute=0`;
};

const getFacebookEmbedUrl = (url: string): string | null => {
    if (!url || !url.includes('facebook.com')) return null;
    if (url.includes('/videos/') || url.includes('/share/v/')) {
        // Set autoplay to 0
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=0&mute=0&loop=1&controls=1`;
    }
    return null;
};

const getStreamableEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: '0', // Changed to 0
    mute: '0',
    loop: '1',
    controls: '1',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};

const isDirectVideoUrl = (url: string): boolean => {
    if (!url) return false;
    return url.startsWith('/') || /\.(mp4|webm|ogg)$/.test(url.split('?')[0]);
};

const IframePlayer = ({ src, title, className }: { src: string, title: string, className?: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    
    return (
        <div className={cn("relative w-full h-full", className)}>
            {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                    <Loader className="h-8 w-8 animate-spin" />
                </div>
            )}
            <iframe
                key={src} 
                src={src}
                title={title}
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className={cn("w-full h-full", isLoading ? "opacity-0" : "opacity-100 transition-opacity")}
                onLoad={() => setIsLoading(false)}
            ></iframe>
             {/* This overlay allows the parent carousel to scroll on mobile */}
             <div className="absolute inset-0 z-20 cursor-pointer"></div>
        </div>
    );
};


const DirectVideoPlayer = ({ src, className, isActivated, inCarousel }: { src: string, className?: string, isActivated?: boolean, inCarousel?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
    
    if (!src) {
        return (
            <div className={cn("relative w-full h-full", className)}>
                <Image
                    src="https://placehold.co/600x400.png"
                    alt="Invalid video source"
                    fill
                    unoptimized
                    data-ai-hint="error"
                    className='object-cover'
                />
            </div>
        );
    }
    
    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation(); 
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
            } else {
                videoRef.current.pause();
            }
        }
    };
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };


    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.onplay = () => setIsPlaying(true);
            videoRef.current.onpause = () => setIsPlaying(false);
            if (inCarousel) {
                videoRef.current.play().catch(e => console.log("Autoplay blocked"));
            }
        }
    }, [inCarousel]);

    useEffect(() => {
        if (videoRef.current && !inCarousel) {
            if (isActivated) {
                videoRef.current.play().catch(console.error);
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActivated, inCarousel]);
    
    useEffect(() => {
      if(videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted])

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={inCarousel || isActivated}
                loop={true}
                playsInline
                muted={isMuted}
                className={cn("w-full h-full object-cover", className)}
            />
             <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={togglePlay}
            >
                {isPlaying ? (
                    <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                        <Pause className="h-8 w-8 fill-white" />
                    </div>
                ) : (
                    <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 fill-white" />
                    </div>
                )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white bg-black/30 hover:bg-black/50 rounded-full h-8 w-8">
                    {isMuted ? <VolumeX className="h-4 w-4 fill-white" /> : <Volume2 className="h-4 w-4 fill-white" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleFullscreen} className="text-white bg-black/30 hover:bg-black/50 rounded-full h-8 w-8">
                    <Maximize className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false, isActivated = false, inCarousel = false }: VideoPlayerProps) => {

  const renderContent = () => {
    if (mediaType === 'image') {
      return (
        <Image
          src={videoUrl || 'https://placehold.co/600x400.png'}
          alt={title}
          fill
          unoptimized
          className={cn('object-cover', className)}
          data-ai-hint="spiritual event"
        />
      );
    }
    
    const url = videoUrl || '';

    const embedUrl = 
        getYoutubeEmbedUrl(url) ||
        getTikTokEmbedUrl(url) ||
        getFacebookEmbedUrl(url) ||
        getStreamableEmbedUrl(url);

    if (embedUrl) {
       return <IframePlayer src={embedUrl} title={title} className={className} />;
    }

    if (isDirectVideoUrl(url)) {
      return <DirectVideoPlayer src={url} className={cn(className, 'object-cover')} isActivated={isActivated} inCarousel={inCarousel} />;
    }
    
    // Fallback for any other URL or invalid URL
    return (
        <div className={cn("relative w-full h-full", className)}>
            <Image
                src="https://placehold.co/600x400.png"
                alt="Invalid video source"
                fill
                unoptimized
                data-ai-hint="error"
                className='object-cover'
            />
        </div>
    );
  };

  return (
    <div
      data-video-player
      className={cn(
        "relative w-full h-full bg-black flex items-center justify-center text-white overflow-hidden",
        className
      )}
    >
      {renderContent()}
    </div>
  );
};
