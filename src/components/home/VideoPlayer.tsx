
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Pause, Play, Volume2, VolumeX, Loader } from 'lucide-react';
import { getUserProfile, incrementCeremonyViewCount, updateVideoProgress, getVideoProgress } from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

interface VideoPlayerProps {
  ceremonyId: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  videoFit?: 'cover' | 'contain';
  title: string;
  className?: string;
  controls?: boolean;
  isActivated?: boolean;
  inCarousel?: boolean;
  defaultMuted?: boolean;
  trackProgress?: boolean;
  userId?: string | null;
}

const getYoutubeEmbedUrl = (url: string, isActivated: boolean): string | null => {
  if (!url) return null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : null;
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: isActivated ? '1' : '0', 
    loop: '1',
    controls: '1',
    playlist: videoId,
    mute: '0',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string, isActivated: boolean): string | null => {
    if (!url) return null;
    const videoId = url.split('video/')[1]?.split('?')[0];
    if (!videoId) return null;
    const autoplay = isActivated ? '1' : '0';
    const mute = '1'; // Always mute TikTok embeds on our side
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=${autoplay}&loop=0&controls=1&mute=${mute}`;
};

const getFacebookEmbedUrl = (url: string, isActivated: boolean): string | null => {
    if (!url || !url.includes('facebook.com')) return null;
    if (url.includes('/videos/') || url.includes('/share/v/')) {
        const autoplay = isActivated ? '1' : '0';
        const mute = '1';
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=${autoplay}&mute=${mute}&loop=1&controls=1`;
    }
    return null;
};

const getStreamableEmbedUrl = (url: string, isActivated: boolean): string | null => {
  if (!url) return null;
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: isActivated ? '1' : '0',
    mute: '1',
    loop: '1',
    controls: '1',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};

const isDirectVideoUrl = (url: string): boolean => {
    if (!url) return false;
    return url.startsWith('/') || /\.(mp4|webm|ogg)$/.test(url.split('?')[0]) || url.includes('githubusercontent');
};

const IframePlayer = ({ src, title, className, onPlay }: { src: string, title: string, className?: string, onPlay: () => void }) => {
    const [isLoading, setIsLoading] = useState(true);
    const hasPlayed = useRef(false);

    const handleLoad = () => {
        setIsLoading(false);
        // Attempt to detect play, though it's unreliable with iframes
        if (!hasPlayed.current) {
            onPlay();
            hasPlayed.current = true;
        }
    }
    
    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none">
                    <Loader className="h-8 w-8 animate-spin" />
                </div>
            )}
            <div className='w-full h-full'>
              <iframe
                  key={src} // Force re-render when src changes
                  src={src}
                  title={title}
                  frameBorder="0"
                  scrolling="no"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className={cn("w-full h-full", isLoading ? "opacity-0" : "opacity-100 transition-opacity")}
                  onLoad={handleLoad}
              ></iframe>
            </div>
        </div>
    );
};


const DirectVideoPlayer = ({ src, className, isActivated, inCarousel, videoFit = 'cover', onPlay, defaultMuted = true, trackProgress, videoId, userId }: { src: string, videoId: string, className?: string, isActivated?: boolean, inCarousel?: boolean, videoFit?: 'cover' | 'contain', onPlay: () => void, defaultMuted?: boolean, trackProgress?: boolean, userId?: string | null }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(defaultMuted);
    const hasPlayed = useRef(false);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const startProgressTracking = () => {
        if (!trackProgress || !userId || !videoId || progressIntervalRef.current) return;
        progressIntervalRef.current = setInterval(() => {
            if (videoRef.current) {
                updateVideoProgress(userId, videoId, videoRef.current.currentTime);
            }
        }, 5000); // Save every 5 seconds
    };

    const stopProgressTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };
    
    useEffect(() => {
      const video = videoRef.current;
      if (video) {
        if (isActivated) {
          video.play().catch(console.error);
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    }, [isActivated]);

    useEffect(() => {
        const video = videoRef.current;
        if(video) {
            const handlePlay = () => {
                setIsPlaying(true);
                if (!hasPlayed.current) {
                    onPlay();
                    hasPlayed.current = true;
                }
                startProgressTracking();
            };
            const handlePause = () => {
                setIsPlaying(false);
                stopProgressTracking();
            }
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            
            // Set initial playing state
            if (!video.paused) {
                handlePlay();
            }

            // Fetch and set initial progress
            if (trackProgress && userId && videoId) {
                getVideoProgress(userId, videoId).then(time => {
                    if (time && videoRef.current) {
                        videoRef.current.currentTime = time;
                    }
                });
            }

            return () => {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                stopProgressTracking();
            }
        }
    }, [inCarousel, onPlay, trackProgress, userId, videoId]);

    useEffect(() => {
      if(videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted])

    const togglePlay = () => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    }

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                autoPlay={isActivated}
                loop={true}
                playsInline
                muted={isMuted}
                className={cn("w-full h-full", videoFit === 'cover' ? 'object-cover' : 'object-contain', className)}
            />
             {(inCarousel) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlay}
                        className="h-14 w-14 rounded-full text-white bg-black/50 hover:bg-black/70 hover:text-white"
                    >
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                </div>
            )}
        </div>
    );
};

export const VideoPlayer = ({ ceremonyId, videoUrl, mediaType, videoFit, title, className, controls = false, isActivated = false, inCarousel = false, defaultMuted, trackProgress = false }: VideoPlayerProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setIsAdmin(!!profile?.isAdmin || currentUser.email === ADMIN_EMAIL);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePlay = () => {
    if (!isAdmin && !trackProgress) { // Don't count view for courses
      incrementCeremonyViewCount(ceremonyId);
    }
  }

  const renderContent = () => {
    if (mediaType === 'image') {
      return (
        <div className="relative w-full h-full">
            <Image
            src={videoUrl || 'https://placehold.co/600x400.png'}
            alt={title}
            fill
            unoptimized
            className={cn('object-cover', className)}
            data-ai-hint="spiritual event"
            />
        </div>
      );
    }
    
    const url = videoUrl || '';

    const embedUrl = 
        getYoutubeEmbedUrl(url, isActivated) ||
        getTikTokEmbedUrl(url, isActivated) ||
        getFacebookEmbedUrl(url, isActivated) ||
        getStreamableEmbedUrl(url, isActivated);

    if (embedUrl) {
       return <IframePlayer src={embedUrl} title={title} className={className} onPlay={handlePlay} />;
    }

    if (isDirectVideoUrl(url)) {
      return <DirectVideoPlayer src={url} className={className} isActivated={isActivated} inCarousel={inCarousel} videoFit={videoFit} onPlay={handlePlay} defaultMuted={defaultMuted === undefined ? !isActivated : defaultMuted} trackProgress={trackProgress} videoId={ceremonyId} userId={user?.uid} />;
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
