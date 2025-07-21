
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Pause, Play } from 'lucide-react';

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
    autoplay: '1',
    loop: '1',
    controls: '1',
    playlist: videoId,
    mute: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const videoId = url.split('video/')[1]?.split('?')[0];
    if (!videoId) return null;
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&loop=1&controls=1&mute=1`;
};

const getFacebookEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) return null;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=1&mute=1&loop=1&controls=1`;
};

const getStreamableEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '1',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};

const isDirectVideoUrl = (url: string): boolean => {
    if (!url) return false;
    // Handle local paths and common video file extensions
    return url.startsWith('/') || /\.(mp4|webm|ogg)(\?.*)?$/.test(url);
};


const IframePlaceholder = ({ onClick, title, className }: { onClick: () => void, title: string, className?: string }) => (
    <div className={cn("relative w-full h-full cursor-pointer", className)} onClick={onClick}>
        <Image
            src="https://i.postimg.cc/pXjZ1K2M/video-placeholder.png"
            alt={`${title} video thumbnail`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="video social media"
            className='object-cover'
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white z-10">
            <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 fill-white" />
            </div>
        </div>
    </div>
);

const DirectVideoPlayer = ({ src, className, isActivated, inCarousel }: { src: string, className?: string, isActivated?: boolean, inCarousel?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Safety check: if src is not provided, render a placeholder to avoid crashes.
    if (!src) {
        return (
            <div className={cn("relative w-full h-full", className)}>
                <Image
                    src="https://placehold.co/600x400.png"
                    alt="Invalid video source"
                    layout="fill"
                    objectFit="cover"
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
    
    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.onplay = () => setIsPlaying(true);
            videoRef.current.onpause = () => setIsPlaying(false);
            if (inCarousel) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(e => console.log("Autoplay blocked"));
            } else {
                 videoRef.current.muted = true;
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

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={inCarousel}
                loop={true}
                playsInline
                muted={true}
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
        </div>
    );
};


export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false, isActivated = false, inCarousel = false }: VideoPlayerProps) => {

  const renderContent = () => {
    if (!videoUrl) {
      return (
        <Image
          src={'https://placehold.co/600x400.png'}
          alt={title}
          layout="fill"
          objectFit="cover"
          className={cn('object-cover', className)}
          data-ai-hint="spiritual event"
        />
      );
    }
    
    if (mediaType === 'image') {
       return (
        <Image
          src={videoUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className={cn('object-cover', className)}
          data-ai-hint="spiritual event"
        />
      );
    }

    const embedUrl = 
        getYoutubeEmbedUrl(videoUrl) ||
        getTikTokEmbedUrl(videoUrl) ||
        getFacebookEmbedUrl(videoUrl) ||
        getStreamableEmbedUrl(videoUrl);

    if (embedUrl) {
        if (isActivated || inCarousel) {
            return (
              <iframe
                src={embedUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            );
        }
        return <IframePlaceholder onClick={() => {}} title={title} className={className} />;
    }

    if (isDirectVideoUrl(videoUrl)) {
      return <DirectVideoPlayer src={videoUrl} className={cn(className, 'object-cover')} isActivated={isActivated} inCarousel={inCarousel} />;
    }

    // Fallback for any other URL (like GitHub raw links, etc.)
    return <IframePlaceholder onClick={() => window.open(videoUrl, '_blank')} title={title} className={className} />;
  };

  return (
    <div
      data-video-player
      className={cn(
        "relative w-full h-full bg-black flex items-center justify-center text-white overflow-hidden",
        isActivated && 'cursor-default',
        className
      )}
    >
      {renderContent()}
    </div>
  );
};
