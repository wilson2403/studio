
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
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const videoId = url.split('video/')[1]?.split('?')[0];
    if (!videoId) return null;
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&loop=1&controls=1`;
};

const getFacebookEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) return null;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=1&mute=0&loop=1&controls=1`;
};

const getStreamableEmbedUrl = (url: string): string | null => {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '0',
    loop: '1',
    controls: '1',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};

const IframePlaceholder = ({ onClick, title }: { onClick: () => void, title: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50 cursor-pointer" onClick={onClick}>
    <Image
      src="https://placehold.co/600x400.png"
      alt={`${title} video thumbnail`}
      layout="fill"
      objectFit="cover"
      data-ai-hint="video social media"
    />
    <div className="absolute inset-0 bg-black/50"></div>
    <div className="relative z-10 flex flex-col items-center">
      <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
        <Play className="h-8 w-8 fill-white" />
      </div>
    </div>
  </div>
);

const DirectVideoPlayer = ({ src, className, isActivated, inCarousel }: { src: string, className?: string, isActivated?: boolean, inCarousel?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isInteracted, setIsInteracted] = useState(false);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation(); 
        setIsInteracted(true);
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
    
    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.onplay = () => setIsPlaying(true);
            videoRef.current.onpause = () => setIsPlaying(false);
            if (!inCarousel) {
                videoRef.current.muted = true;
            }
        }
    }, [inCarousel]);

    useEffect(() => {
        if (videoRef.current) {
            if (isActivated && !inCarousel) {
                videoRef.current.play().catch(console.error);
            } else if (!isActivated && !inCarousel) {
                videoRef.current.pause();
            }
        }
    }, [isActivated, inCarousel]);

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={isActivated && !inCarousel}
                loop={!inCarousel}
                playsInline
                muted={!inCarousel}
                className={cn("w-full h-full object-cover", className)}
            />
            {!isPlaying && (
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8" />
                    </div>
                </div>
            )}
             {isPlaying && inCarousel && (
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                        <Pause className="h-8 w-8" />
                    </div>
                </div>
             )}
        </div>
    );
};


export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false, isActivated = false, inCarousel = false }: VideoPlayerProps) => {
  const [showIframe, setShowIframe] = useState(false);

  const embedUrl = 
      getYoutubeEmbedUrl(videoUrl || '') ||
      getTikTokEmbedUrl(videoUrl || '') ||
      getFacebookEmbedUrl(videoUrl || '') ||
      getStreamableEmbedUrl(videoUrl || '');

  const renderContent = () => {
    if (mediaType === 'image' || !videoUrl) {
      return (
        <Image
          src={videoUrl || 'https://placehold.co/600x400.png'}
          alt={title}
          layout="fill"
          objectFit="cover"
          className={cn('object-cover', className)}
          data-ai-hint="spiritual event"
        />
      );
    }
    
    if (embedUrl) {
      const shouldShow = (isActivated && !inCarousel) || (inCarousel && showIframe);
      if (shouldShow) {
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
      return <IframePlaceholder onClick={() => setShowIframe(true)} title={title} />;
    }

    // Fallback to direct video player
    if (mediaType === 'video') {
      return <DirectVideoPlayer src={videoUrl} className={cn(className, 'object-cover')} isActivated={isActivated} inCarousel={inCarousel} />;
    }

    // Final fallback, should be unreachable
    return <div className="bg-black"></div>;
  };

  return (
    <div
      data-video-player
      className={cn(
        "relative w-full h-full bg-black flex items-center justify-center text-white overflow-hidden",
        !inCarousel && 'cursor-pointer',
        className
      )}
    >
      {renderContent()}
    </div>
  );
};
