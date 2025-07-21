
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
    mute: '1',
    loop: controls ? '0' : '1',
    controls: controls ? '1' : '0',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

const TikTokPlayer = ({ url, title, className, controls }: { url: string; title: string; className?: string, controls?: boolean }) => {
    const embedUrl = `https://www.tiktok.com/embed/v2/${url.split('video/')[1]}?autoplay=1&mute=1&loop=1&controls=${controls ? '1':'0'}`;

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


const FacebookPlayer = ({ url, title, className, controls }: { url: string; title: string; className?: string, controls?: boolean }) => {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=1&mute=1&loop=1&controls=${controls ? '1':'0'}`;

    return (
        <iframe
            src={embedUrl}
            title={title}
            className={cn('w-full h-full bg-black', className)}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
        >
        </iframe>
    );
};


function getStreamableEmbedUrl(url: string, controls: boolean): string | null {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        controls: controls ? '1' : '0'
    })
    return `https://streamable.com/e/${match[1]}?${params.toString()}`;
  }
  return null;
}

const DirectVideoPlayer = ({ src, className, controls }: { src: string, className?: string, controls?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(!controls); // Autoplay if no controls

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation(); 
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

export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false }: VideoPlayerProps) => {
  const [isIframeActivated, setIsIframeActivated] = useState(false);

  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl, controls, isIframeActivated && !controls) : null;
  const streamableEmbedUrl = videoUrl ? getStreamableEmbedUrl(videoUrl, controls) : null;
  const isTikTok = videoUrl && videoUrl.includes('tiktok.com');
  const isFacebook = videoUrl && videoUrl.includes('facebook.com');

  const activateIframe = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsIframeActivated(true);
  }

  const renderPlayer = () => {
      if (youtubeEmbedUrl || streamableEmbedUrl) {
        if (!isIframeActivated && !controls) {
           return (
                <>
                   <Image src={'https://placehold.co/600x400.png?text=YouTube'} alt="Video thumbnail" layout="fill" objectFit="cover" data-ai-hint="video social media" />
                   <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 flex flex-col items-center">
                       <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white rounded-full">
                           <Play className="h-8 w-8 fill-white" />
                       </Button>
                        <p className="mt-4 font-semibold">{title}</p>
                    </div>
                </>
            );
        }
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
        if (!isIframeActivated && !controls) {
           return (
                <>
                   <Image src={'https://placehold.co/100x100/000000/ffffff.png?text=TikTok'} alt="TikTok Logo" width={50} height={50} data-ai-hint="tiktok logo" />
                   <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 flex flex-col items-center">
                       <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white rounded-full">
                           <Play className="h-8 w-8 fill-white" />
                       </Button>
                        <p className="mt-4 font-semibold">{title}</p>
                         <p className="text-sm text-gray-300 mt-2">Haz clic para reproducir</p>
                    </div>
                </>
            );
        }
        return <TikTokPlayer url={videoUrl!} title={title} className={className} controls={controls} />;
      }
      
      if (isFacebook) {
        if (!isIframeActivated && !controls) {
            return (
                <>
                    <Image src={'https://placehold.co/600x400.png?text=Facebook'} alt="Facebook video thumbnail" layout="fill" objectFit="cover" data-ai-hint="social media video" />
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white rounded-full">
                            <Play className="h-8 w-8 fill-white" />
                        </Button>
                        <p className="mt-4 font-semibold">{title}</p>
                    </div>
                </>
            );
        }
        return <FacebookPlayer url={videoUrl!} title={title} className={className} controls={controls} />;
      }
    
      if (mediaType === 'video' && videoUrl && (videoUrl.startsWith('https') || videoUrl.startsWith('data:'))) {
         return <DirectVideoPlayer src={videoUrl} className={className} controls={controls} />;
      }
    
      if (mediaType === 'image' || !videoUrl) {
        return <Image src={videoUrl || 'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual ceremony" />;
      }
    
      return <Image src={'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual event" />;
  }

  return (
    <div 
        data-video-player
        className={cn("relative w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center cursor-pointer", className)}
        onClick={activateIframe}
    >
      {renderPlayer()}
    </div>
  );
};
