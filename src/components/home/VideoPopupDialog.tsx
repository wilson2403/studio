'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';

interface VideoPopupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  title: string;
}

export default function VideoPopupDialog({ isOpen, onClose, videoUrl, mediaType, title }: VideoPopupDialogProps) {
  const isTikTok = videoUrl?.includes('tiktok.com');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-full max-w-7xl max-h-[90vh]">
        <DialogTitle className="sr-only">{title}</DialogTitle>
         <div className={cn(
            "w-full h-auto",
            isTikTok ? "aspect-[9/16] max-h-[90vh]" : "aspect-video"
         )}>
          <VideoPlayer
            videoUrl={videoUrl}
            mediaType={mediaType}
            title={title}
            isActivated={true} 
            inCarousel={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
