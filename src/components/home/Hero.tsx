
'use client';

import { EditableTitle } from './EditableTitle';
import { useTranslation } from 'react-i18next';
import { useEditable } from './EditableProvider';
import { useEffect, useState } from 'react';
import { getContent } from '@/lib/firebase/firestore';
import { Button } from '../ui/button';
import { Edit } from 'lucide-react';
import EditHeroDialog from './EditHeroDialog';

const DEFAULT_VIDEO_URL = "https://videos.pexels.com/video-files/3130181/3130181-hd_1920_1080_25fps.mp4";
const VIDEO_CONTENT_ID = 'heroVideoUrl';

function getStreamableEmbedUrl(url: string): string | null {
  const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://streamable.com/e/${match[1]}?autoplay=1&muted=1&loop=1`;
  }
  return null;
}

const VideoPlayer = ({ url, title }: { url: string; title: string }) => {
    const streamableEmbedUrl = getStreamableEmbedUrl(url);

    if (streamableEmbedUrl) {
    return (
        <iframe
        src={streamableEmbedUrl}
        frameBorder="0"
        allow="autoplay; muted; loop"
        allowFullScreen
        className="w-full h-full object-cover"
        ></iframe>
    );
    }

    return (
        <video
            key={url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            src={url}
        ></video>
    );
}


export default function Hero() {
  const { t } = useTranslation();
  const { isAdmin } = useEditable();
  const [videoUrl, setVideoUrl] = useState(DEFAULT_VIDEO_URL);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      const url = await getContent(VIDEO_CONTENT_ID);
      if (url) {
        setVideoUrl(url);
      }
    };
    fetchVideoUrl();
  }, []);
  
  const handleUpdate = (newUrl: string) => {
    setVideoUrl(newUrl);
    setIsEditDialogOpen(false);
  }

  return (
    <section className="relative w-full py-20 md:py-32 flex flex-col items-center justify-center text-center gap-12 group">
      
      <div className="container relative animate-in fade-in-0 duration-1000 z-20">
        <div className="flex flex-col items-center space-y-2">
          <EditableTitle 
            tag="h1"
            id="heroTitle"
            initialValue={t('heroTitle')}
            className="text-4xl md:text-6xl font-headline tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
          />
          <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body">
             <EditableTitle 
                tag="p"
                id="heroSubtitle1"
                initialValue={t('heroSubtitle1')}
            />
          </div>
        </div>
      </div>
      
       <div className="relative w-full max-w-5xl mx-auto animate-in fade-in-0 zoom-in-95 duration-1000 delay-500">
            {isAdmin && (
            <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -top-4 -right-4 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 transition-opacity"
                onClick={() => setIsEditDialogOpen(true)}
            >
                <Edit className="h-5 w-5" />
            </Button>
            <EditHeroDialog 
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onUpdate={handleUpdate}
                currentVideoUrl={videoUrl}
                contentId={VIDEO_CONTENT_ID}
            />
            </>
        )}
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30">
                 <VideoPlayer url={videoUrl} title={t('heroTitle')} />
            </div>
      </div>
      <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body animate-in fade-in-0 duration-1000 delay-700">
        <EditableTitle 
            tag="p"
            id="heroSubtitle2"
            initialValue={t('heroSubtitle2')}
        />
      </div>

    </section>
  );
}
