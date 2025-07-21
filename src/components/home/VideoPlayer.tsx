
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { useTranslation } from 'react-i18next';

interface VideoPlayerProps {
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  title: string;
  className?: string;
  controls?: boolean;
}

function getYouTubeEmbedUrl(url: string, controls: boolean): string | null {
  if (!url) return null;
  let videoId = null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    videoId = match[1];
  }
  if (!videoId) return null;
  
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: controls ? '0' : '1',
    controls: controls ? '1' : '0',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

const TikTokPlayer = ({ url, title, className, controls }: { url: string; title: string; className?: string, controls?: boolean }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const videoIdMatch = url.match(/video\/(\d+)/);
  if (!videoIdMatch) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn("w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 text-center", className)}>
         <Image src={'https://placehold.co/100x100/000000/ffffff.png?text=TikTok'} alt="TikTok Logo" width={50} height={50} />
         <p className="mt-4 font-semibold">{title}</p>
         <p className="text-sm text-gray-300 mt-2">{t('videoPlayerClickToPlay')}</p>
      </a>
    );
  }
  const videoId = videoIdMatch[1];
  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&loop=1&mute=0&controls=${controls ? '1' : '0'}`;

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      title={title}
      className={cn("w-full h-full", className)}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};


function getFacebookEmbedUrl(url: string, controls: boolean): string | null {
    if (!url) return null;
    const facebookRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|photo\.php\?v=|reel\/|.*\/videos\/|share\/(?:v|r)\/)([0-9a-zA-Z_.-]+)/;
    const match = url.match(facebookRegex);
    if (match && match[1]) {
        const params = new URLSearchParams({
            href: url,
            show_text: '0',
            width: '560',
            autoplay: '1',
            mute: '1',
            loop: controls ? '0' : '1',
            controls: controls ? '1' : '0'
        });
        return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
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

export const VideoPlayer = ({ videoUrl, mediaType, title, className, controls = false }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl, controls) : null;
  const isTikTok = videoUrl && videoUrl.includes('tiktok.com');
  const facebookEmbedUrl = videoUrl ? getFacebookEmbedUrl(videoUrl, controls) : null;
  const streamableEmbedUrl = videoUrl ? getStreamableEmbedUrl(videoUrl) : null;

  useEffect(() => {
    if (facebookEmbedUrl && containerRef.current) {
        if (typeof (window as any).FB !== 'undefined') {
            (window as any).FB.XFBML.parse(containerRef.current.parentElement);
        }
    }
  }, [facebookEmbedUrl]);

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
  
  if (facebookEmbedUrl) {
    return (
        <div ref={containerRef} className={cn('w-full h-full', className)} data-href={videoUrl} data-lazy="true">
            <div className="fb-video"
                data-href={videoUrl}
                data-width="auto"
                data-height="auto"
                data-show-text="false"
                data-autoplay="true"
                data-mute="true"
                data-loop={controls ? "false" : "true"}
                data-allowfullscreen="true"
                data-controls={controls ? "true" : "false"}>
            </div>
        </div>
    );
  }

  if (mediaType === 'video' && videoUrl && videoUrl.match(/\.(mp4|webm)$/)) {
     return <video src={videoUrl} autoPlay loop={!controls} muted playsInline controls={controls} className={className} />;
  }

  if (mediaType === 'image' || !videoUrl) {
    return <Image src={videoUrl || 'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual ceremony" />;
  }

  return <Image src={'https://placehold.co/600x400.png'} alt={title} width={600} height={400} className={className} data-ai-hint="spiritual event" />;
};
