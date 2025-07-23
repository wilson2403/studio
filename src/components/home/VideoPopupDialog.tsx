
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-[90vw] h-[90vh]">
        <DialogTitle className="sr-only">{title}</DialogTitle>
         <div className="w-full h-full">
          <VideoPlayer
            ceremonyId="" // Not needed for popup analytics
            videoUrl={videoUrl}
            mediaType={mediaType}
            title={title}
            isActivated={true} 
            inCarousel={true}
            videoFit="contain"
            className="w-full h-full"
            defaultMuted={false} // Always play sound in popup
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
