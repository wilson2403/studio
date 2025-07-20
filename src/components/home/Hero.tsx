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
    <section className="relative w-full h-screen overflow-hidden flex items-center justify-center group">
      <video
        key={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src={videoUrl}
      ></video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-grid-white/[0.07] bg-center [mask-image:linear-gradient(to_bottom,white,transparent_70%)] z-10"></div>
      
      {isAdmin && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-20 right-4 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
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

      <div className="container relative text-center animate-in fade-in-0 duration-1000 z-20">
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
             <EditableTitle 
                tag="p"
                id="heroSubtitle2"
                initialValue={t('heroSubtitle2')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
