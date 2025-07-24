
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from './VideoPlayer';

interface VideoPopupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  title: string;
}

export default function VideoPopupDialog({ isOpen, onClose, videoUrl, mediaType, title }: VideoPopupDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 border-0 bg-transparent">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video relative">
          <VideoPlayer
            ceremonyId={title} // Use title as a unique key for the player
            videoUrl={videoUrl}
            mediaType={mediaType}
            title={title}
            isActivated={true}
            defaultMuted={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
