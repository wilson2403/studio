
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
}

function getYouTubeEmbedUrl(url: string, controls: boolean, autoplay: boolean): string | null {
  if (!url) return null;
  let videoId = null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    videoId = match[1];
  }
  if (!videoId) return null;
  
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '0',
    loop: controls ? '0' : '1',
    controls: controls ? '1' : '0',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

const TikTokPlayer = ({ url, title, className, controls }: { url: string; title: string; className?: string, controls?: boolean }) => {
  const [isActivated, setIsActivated] = useState(false);
  
  const videoIdMatch = url.match(/video\/(\d+)/);
  if (!videoIdMatch) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn("w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center", className)}>
         <Image src={'https://placehold.co/100x100/000000/ffffff.png?text=TikTok'} alt="TikTok Logo" width={50} height={50} data-ai-hint="tiktok logo" />
         <p className="mt-4 font-semibold">{title}</p>
         <p className="text-sm text-gray-300 mt-2">Haz clic para ver en TikTok</p>
      </a>
    );
  }
  
  if (!isActivated) {
    return (
      <div className={cn("relative w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center cursor-pointer", className)} onClick={() => setIsActivated(true)}>
        <Image src={'https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0037-euttp/98471a6296314f149b81b8f52281a711_1622323062?x-expires=1671566400&x-signature=2B7x7B4bZ9f5j3v9a5H3jD%2B5f%2B4%3D'} alt="TikTok thumbnail" layout="fill" objectFit="cover" data-ai-hint="tiktok video" />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col items-center">
            <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white rounded-full">
                <Play className="h-8 w-8 fill-white" />
            </Button>
            <p className="mt-4 font-semibold">{title}</p>
        </div>
      </div>
    );
  }

  const videoId = videoIdMatch[1];
  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&loop=${controls ? '0' : '1'}&mute=0&controls=${controls ? '1' : '0'}`;

  return (
    <iframe
      src={embedUrl}
      title={title}
      className={cn("w-full h-full", className)}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};


function getFacebookEmbedUrl(url: string, controls: boolean, autoplay: boolean): string | null {
    if (!url) return null;
    const facebookRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|reel\/|.*\/videos\/|share\/(?:v|r)\/)([0-9a-zA-Z_.-]+)/;
    const match = url.match(facebookRegex);
    if (match && match[1]) {
        const params = new URLSearchParams({
            href: url,
            show_text: '0',
            width: '560',
            autoplay: autoplay ? '1' : '0',
            mute: '0',
            loop: controls ? '0' : '1',
            controls: controls ? '1' : '0'
        });
        return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
    }
    return null;
}

const FacebookPlayer = ({ url, title, className, controls }: { url: string; title: string; className?: string, controls?: boolean }) => {
    const [isActivated, setIsActivated] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const embedUrl = getFacebookEmbedUrl(url, controls, isActivated);

    useEffect(() => {
        if (isActivated && embedUrl && containerRef.current) {
            if (typeof (window as any).FB !== 'undefined') {
                (window as any).FB.XFBML.parse(containerRef.current.parentElement);
            }
        }
    }, [isActivated, embedUrl]);

    if (!embedUrl) {
         return <Image src={'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="social media video" />;
    }

    if (!isActivated) {
         return (
             <div className={cn("relative w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center cursor-pointer", className)} onClick={() => setIsActivated(true)}>
                <Image src={'https://placehold.co/600x400.png?text=Facebook'} alt="Facebook video thumbnail" layout="fill" objectFit="cover" data-ai-hint="social media video" />
                <div className="absolute inset-0 bg-black/50"></div>
                 <div className="relative z-10 flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white rounded-full">
                        <Play className="h-8 w-8 fill-white" />
                    </Button>
                     <p className="mt-4 font-semibold">{title}</p>
                 </div>
             </div>
         );
    }

    return (
        <div ref={containerRef} className={cn('w-full h-full bg-black', className)} data-href={url} data-lazy="true">
            <div className="fb-video"
                data-href={url}
                data-width="auto"
                data-height="auto"
                data-show-text="false"
                data-autoplay="true"
                data-mute="0"
                data-loop={controls ? "false" : "true"}
                data-allowfullscreen="true"
                data-controls={controls ? "true" : "false"}>
            </div>
        </div>
    );
};


function getStreamableEmbedUrl(url: string): string | null {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://streamable.com/e/${match[1]}?autoplay=1&muted=0&loop=1`;
  }
  return null;
}

const DirectVideoPlayer = ({ src, className, controls }: { src: string, className?: string, controls?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(!controls); // Autoplay if no controls

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
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
        }
    }, [])

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={!controls}
                loop={!controls}
                playsInline
                controls={controls}
                className={cn("w-full h-full object-cover", className)}
                onClick={togglePlay}
            />
            {!controls && (
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={togglePlay}
                >
                    <Button variant="ghost" size="icon" className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full">
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                </div>
            )}
        </div>
    );
};

export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false }: VideoPlayerProps) => {
  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl, controls, !controls) : null;
  const isTikTok = videoUrl && videoUrl.includes('tiktok.com');
  const isFacebook = videoUrl && videoUrl.includes('facebook.com');
  const streamableEmbedUrl = videoUrl ? getStreamableEmbedUrl(videoUrl) : null;

  if (youtubeEmbedUrl || streamableEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl || streamableEmbedUrl || ''}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={className}
      ></iframe>
    );
  }

  if (isTikTok) {
    return <TikTokPlayer url={videoUrl!} title={title} className={className} controls={controls} />;
  }
  
  if (isFacebook) {
    return <FacebookPlayer url={videoUrl!} title={title} className={className} controls={controls} />;
  }

  if (mediaType === 'video' && videoUrl && (videoUrl.startsWith('https') || videoUrl.startsWith('data:'))) {
     return <DirectVideoPlayer src={videoUrl} className={className} controls={controls} />;
  }

  if (mediaType === 'image' || !videoUrl) {
    return <Image src={videoUrl || 'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual ceremony" />;
  }

  return <Image src={'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual event" />;
};
