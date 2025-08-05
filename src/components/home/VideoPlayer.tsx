

'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Pause, Play, Volume2, VolumeX, Loader } from 'lucide-react';
import { getUserProfile, incrementCeremonyViewCount, updateVideoProgress, getVideoProgress, logUserAction } from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const getYoutubeEmbedUrl = (url: string, autoplay: boolean, defaultMuted: boolean): string | null => {
  if (!url) return null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : null;
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0', 
    loop: '1',
    playlist: videoId,
    mute: defaultMuted ? '1' : '0',
    vq: 'hd2160',
    rel: '0',
    showinfo: '0',
    enablejsapi: '1'
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getTikTokEmbedUrl = (url: string, autoplay: boolean, defaultMuted: boolean): string | null => {
    if (!url) return null;

    // Regex to capture video ID from standard and short URLs
    const tiktokRegex = /(?:tiktok\.com\/.*\/video\/|vm\.tiktok\.com\/)([0-9a-zA-Z]+)/;
    const match = url.match(tiktokRegex);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        // Fallback for user profile links which might not be embeddable but prevents crashes
        if (url.includes('tiktok.com/@')) return null; 
        return null;
    }

    const autoplayParam = autoplay ? '1' : '0';
    const muteParam = defaultMuted ? '1' : '0';
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=${autoplayParam}&loop=0&controls=1&mute=${muteParam}`;
};


const getFacebookEmbedUrl = (url: string, autoplay: boolean, defaultMuted: boolean): string | null => {
    if (!url || !url.includes('facebook.com')) return null;
    if (url.includes('/videos/') || url.includes('/share/v/')) {
        const autoplayParam = autoplay ? '1' : '0';
        const muteParam = defaultMuted ? '1' : '0';
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=${autoplayParam}&mute=${muteParam}&loop=1&controls=1`;
    }
    return null;
};

const getStreamableEmbedUrl = (url: string, autoplay: boolean, defaultMuted: boolean): string | null => {
  if (!url) return null;
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (!match || !match[1]) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: defaultMuted ? '1' : '0',
    loop: '1',
    controls: '1',
  });
  return `https://streamable.com/e/${match[1]}?${params.toString()}`;
};


const isDirectVideoUrl = (url: string): boolean => {
    if (!url) return false;
    return url.startsWith('/') || /\.(mp4|webm|ogg)$/.test(url.split('?')[0]) || url.includes('githubusercontent');
};

// --- YouTube IFrame API Management ---
let isApiReady = false;
let apiReadyPromise: Promise<void> | null = null;
const pendingPlayers: (() => void)[] = [];

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.onYouTubeIframeAPIReady = () => {
    isApiReady = true;
    pendingPlayers.forEach(playerInit => playerInit());
    pendingPlayers.length = 0; // Clear the queue
  };
}

function loadYoutubeApi() {
  if (!apiReadyPromise) {
    apiReadyPromise = new Promise(resolve => {
      if (isApiReady) {
        resolve();
        return;
      }
      
      // If the API script is already on the page, don't add it again
      if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        // The script is loading, just wait for it to be ready.
        const checkReady = setInterval(() => {
          if (isApiReady) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);
        return;
      }
      
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
       // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
          isApiReady = true;
          pendingPlayers.forEach(playerInit => playerInit());
          pendingPlayers.length = 0;
          resolve();
      };
    });
  }
  return apiReadyPromise;
}
// -------------------------------------

const IframePlayer = ({ src, title, className, onPlay, children }: { src: string, title: string, className?: string, onPlay: () => void, children?: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const hasPlayed = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    const handleLoad = () => {
        setIsLoading(false);
    }
    
    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !src.includes('youtube.com') || !src.includes('enablejsapi=1')) {
          return;
      }
      
      const handlePlayerStateChange = (event: any) => {
        const PlayerState = {
            PLAYING: 1,
            BUFFERING: 3,
        };
        // Trigger onPlay the first time the video is playing or buffering.
        if ((event.data === PlayerState.PLAYING || event.data === PlayerState.BUFFERING) && !hasPlayed.current) {
            onPlay();
            hasPlayed.current = true;
        }
      }
      
      const initializePlayer = () => {
          try {
              // @ts-ignore
              new window.YT.Player(iframe, {
                  events: {
                      'onStateChange': handlePlayerStateChange,
                  }
              });
          } catch(e) {
              console.error("Error initializing YouTube player:", e);
          }
      }
      
      loadYoutubeApi().then(() => {
          if (iframe) {
              initializePlayer();
          }
      });
      
    }, [src, onPlay]);

    
    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none">
                    <Loader className="h-8 w-8 animate-spin" />
                </div>
            )}
            <div className='w-full h-full'>
              <iframe
                  ref={iframeRef}
                  key={src}
                  src={src}
                  title={title}
                  frameBorder="0"
                  scrolling="no"
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  className={cn("w-full h-full", isLoading ? "opacity-0" : "opacity-100 transition-opacity")}
                  onLoad={handleLoad}
              ></iframe>
            </div>
             {children}
        </div>
    );
};


const DirectVideoPlayer = ({ src, videoId, className, videoFit = 'cover', onPlay, defaultMuted = true, trackProgress, userId, autoplay, children }: { src: string, videoId: string, className?: string, videoFit?: 'cover' | 'contain', onPlay: () => void, defaultMuted?: boolean, trackProgress?: boolean, userId?: string | null, autoplay?: boolean, children?: React.ReactNode }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(defaultMuted);
    const hasPlayed = useRef(false);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isIntersecting, setIntersecting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const user = auth.currentUser;
            if(user) {
                const profile = await getUserProfile(user.uid);
                setIsAdmin(profile?.role === 'admin' || profile?.role === 'organizer');
            }
        };
        checkAdmin();
    }, []);
    
    const observer = useRef<IntersectionObserver | null>(null);

    const handlePlay = useCallback(() => {
        if (!hasPlayed.current) {
            onPlay();
            hasPlayed.current = true;
        }
    }, [onPlay]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                setIntersecting(entry.isIntersecting);
            });
        };

        const intersectionObserver = new IntersectionObserver(observerCallback, { threshold: 0.5 });
        intersectionObserver.observe(video);

        return () => {
            intersectionObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !autoplay) return;

        if (isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('Error attempting to autoplay video:', error);
                    }
                });
            }
        } else {
            video.pause();
        }
    }, [isIntersecting, autoplay]);


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
        }, 5000);
    };

    const stopProgressTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };
    
    useEffect(() => {
        const video = videoRef.current;
        if(video) {
            const handlePlayEvent = () => {
                setIsPlaying(true);
                startProgressTracking();
            };
            const handlePauseEvent = () => {
                setIsPlaying(false);
                stopProgressTracking();
            }
            video.addEventListener('play', handlePlayEvent);
            video.addEventListener('pause', handlePauseEvent);
            
            if (!video.paused) {
                handlePlayEvent();
            }

            if (trackProgress && userId && videoId) {
                getVideoProgress(userId, videoId).then(time => {
                    if (time && videoRef.current) {
                        videoRef.current.currentTime = time;
                    }
                });
            }

            return () => {
                video.removeEventListener('play', handlePlayEvent);
                video.removeEventListener('pause', handlePauseEvent);
                stopProgressTracking();
            }
        }
    }, [trackProgress, userId, videoId]);

    useEffect(() => {
      if(videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play();
                setIsMuted(false);
                handlePlay(); // Explicit user interaction
            } else {
                video.pause();
            }
        }
    }
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
    }

    return (
        <div className={cn("relative w-full h-full group/video", className)}>
            <video
                ref={videoRef}
                src={src}
                loop={true}
                playsInline
                muted={isMuted}
                onPlay={handlePlay}
                className={cn("w-full h-full", videoFit === 'cover' ? 'object-cover' : 'object-contain', className)}
            />
            {children}
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
             <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-full text-white bg-black/50 hover:bg-black/70 hover:text-white"
                >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};

export const VideoPlayer = ({ ceremonyId, videoUrl, mediaType, videoFit, autoplay, title, className, defaultMuted, trackProgress = false, onPlay, children }: VideoPlayerProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'organizer');
      } else {
        setIsAdmin(false); // Make sure to set to false if no user
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePlay = useCallback(() => {
    if (!isAdmin) {
      incrementCeremonyViewCount(ceremonyId);
    }
    
    // Only log user action if the user is authenticated
    if (user) {
        const logDetails = { targetId: ceremonyId, targetType: 'ceremony_video' as const, changes: { title: title } };
        const courseLogDetails = { targetId: ceremonyId, targetType: 'course_video' as const, changes: { title: title } };

        if (!trackProgress) {
            logUserAction('play_video', logDetails);
        } else {
            logUserAction('play_video', courseLogDetails);
        }
    }
    if (onPlay) {
        onPlay();
    }
  }, [isAdmin, trackProgress, ceremonyId, onPlay, user, title]);

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
             {children}
        </div>
      );
    }
    
    const url = videoUrl || '';
    const useAutoplay = !!autoplay;
    const useMuted = defaultMuted === undefined ? true : defaultMuted;

    const embedUrl = 
        (mediaType === 'video' || mediaType === 'short video') && 
        (getYoutubeEmbedUrl(url, useAutoplay, useMuted)
        || getTikTokEmbedUrl(url, useAutoplay, useMuted)
        || getFacebookEmbedUrl(url, useAutoplay, useMuted)
        || getStreamableEmbedUrl(url, useAutoplay, useMuted));

    if (embedUrl) {
       return <IframePlayer src={embedUrl} title={title} className={className} onPlay={handlePlay}>{children}</IframePlayer>;
    }

    if (isDirectVideoUrl(url)) {
      return <DirectVideoPlayer src={url} className={cn("absolute inset-0 w-full h-full", className)} videoFit={videoFit} onPlay={handlePlay} defaultMuted={defaultMuted} trackProgress={trackProgress} videoId={ceremonyId} userId={user?.uid} autoplay={autoplay}>{children}</DirectVideoPlayer>;
    }
    
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
             {children}
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

interface VideoPlayerProps {
  ceremonyId: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video' | 'short video';
  videoFit?: 'cover' | 'contain';
  autoplay?: boolean;
  title: string;
  className?: string;
  defaultMuted?: boolean;
  trackProgress?: boolean;
  userId?: string | null;
  onPlay?: () => void;
  children?: React.ReactNode;
}
