
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Script from 'next/script';

interface VideoPlayerProps {
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  title: string;
  className?: string;
}

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

function getFacebookEmbedUrl(url: string): string | null {
    if (!url) return null;
    const facebookRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|photo\.php\?v=|reel\/|.*\/videos\/|share\/(?:v|r)\/)([0-9a-zA-Z_.-]+)/;
    const match = url.match(facebookRegex);
    if (match && match[1]) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=1&mute=1&loop=1&controls=0`;
    }
    return null;
}

function getStreamableEmbedUrl(url: string): string | null {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://streamable.com/e/${match[1]}?autoplay=1&muted=1&loop=1`;
  }
  return null;
}

export const VideoPlayer = ({ videoUrl, mediaType, title, className }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const tiktokData = videoUrl ? getTikTokEmbedData(videoUrl) : null;
  const facebookEmbedUrl = videoUrl ? getFacebookEmbedUrl(videoUrl) : null;
  const streamableEmbedUrl = videoUrl ? getStreamableEmbedUrl(videoUrl) : null;

  useEffect(() => {
    // For Facebook embeds
    if (facebookEmbedUrl && containerRef.current) {
        if (typeof (window as any).FB !== 'undefined') {
            (window as any).FB.XFBML.parse(containerRef.current.parentElement);
        }
    }
  }, [facebookEmbedUrl]);

  useEffect(() => {
    if (tiktokData) {
      const scriptId = 'tiktok-embed-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      
      const loadTikTok = () => {
        if (typeof (window as any).tiktok !== 'undefined') {
          (window as any).tiktok.load();
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        script.onload = loadTikTok;
        document.head.appendChild(script);
      } else if (typeof (window as any).tiktok !== 'undefined') {
        loadTikTok();
      }
    }
  }, [tiktokData]);

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

  if (tiktokData) {
    return (
       <div ref={containerRef} className={cn('w-full h-full', className)}>
         <blockquote
            className={cn("tiktok-embed w-full h-full")}
            cite={videoUrl}
            data-video-id={tiktokData.videoId}
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
          >
           <section className='w-full h-full flex items-center justify-center'>
            <a target="_blank" title={title} rel="noopener noreferrer" href={videoUrl}>
                {title}
            </a>
           </section>
        </blockquote>
      </div>
    );
  }
  
  if (facebookEmbedUrl) {
    return (
        <div ref={containerRef} className={cn('w-full h-full', className)}>
            <div className="fb-video"
                data-href={videoUrl}
                data-width="auto"
                data-height="auto"
                data-show-text="false"
                data-autoplay="true"
                data-mute="true"
                data-loop="true"
                data-allowfullscreen="true"
                data-lazy="true"
                data-controls="false">
            </div>
        </div>
    );
  }

  if (mediaType === 'video' && videoUrl && videoUrl.match(/\.(mp4|webm)$/)) {
     return <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className={className} />;
  }

  if (mediaType === 'image' || !videoUrl) {
    return <Image src={videoUrl || 'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual ceremony" />;
  }

  // Fallback for direct video links that are not mp4/webm, or other cases
  return <Image src={'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual event" />;
};
