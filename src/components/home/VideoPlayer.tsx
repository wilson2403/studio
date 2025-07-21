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
}

const getYoutubeEmbedUrl = (url: string, controls: boolean): string | null => {
  if (!url) return null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : null;
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: controls ? '1' : '0',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string, controls: boolean): string | null => {
    if (!url) return null;
    const videoId = url.split('video/')[1]?.split('?')[0];
    if (!videoId) return null;
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&loop=1&controls=${controls ? '1' : '0'}`;
};

const getFacebookEmbedUrl = (url: string, controls: boolean): string | null => {
    if (!url) return null;
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) return null;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=1&mute=1&loop=1&controls=${controls ? '1' : '0'}`;
};

const getStreamableEmbedUrl = (url: string, controls: boolean): string | null => {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: controls ? '1' : '0',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};

const IframePlaceholder = ({ title }: { title: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
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

const DirectVideoPlayer = ({ src, className, controls }: { src: string, className?: string, controls?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(!controls); // Autoplay if no controls

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
            if (!controls) {
              videoRef.current.muted = true;
            }
        }
    }, [controls]);

    return (
        <div className={cn("relative w-full h-full group/video", className)} onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={!controls}
                loop={!controls}
                playsInline
                controls={controls}
                muted={!controls}
                className={cn("w-full h-full object-cover", className)}
            />
            {!controls && (
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 cursor-pointer"
                >
                    <div className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center">
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </div>
                </div>
            )}
        </div>
    );
};


export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false, isActivated = false }: VideoPlayerProps) => {

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
    
    // Check for embeddable URLs
    const embedUrl = 
      getYoutubeEmbedUrl(videoUrl, controls) ||
      getTikTokEmbedUrl(videoUrl, controls) ||
      getFacebookEmbedUrl(videoUrl, controls) ||
      getStreamableEmbedUrl(videoUrl, controls);

    if (embedUrl) {
      if (isActivated || controls) {
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
      return <IframePlaceholder title={title} />;
    }

    // Fallback to direct video player
    if (mediaType === 'video') {
      return <DirectVideoPlayer src={videoUrl} className={cn(className, 'object-cover')} controls={controls} />;
    }

    // Final fallback
    return <IframePlaceholder title={title} />;
  };

  return (
    <div
      data-video-player
      className={cn(
        "absolute inset-0 w-full h-full bg-black flex items-center justify-center text-white cursor-pointer overflow-hidden",
        className
      )}
    >
      {renderContent()}
    </div>
  );
};
