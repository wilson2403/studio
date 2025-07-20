
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setContent, uploadVideo } from '@/lib/firebase/firestore';
import { Progress } from '../ui/progress';
import { useTranslation } from 'react-i18next';

interface EditHeroDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newUrl: string) => void;
  currentVideoUrl: string;
  contentId: string;
}

export default function EditHeroDialog({ isOpen, onClose, onUpdate, currentVideoUrl, contentId }: EditHeroDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setVideoUrlInput(currentVideoUrl);
    }
  }, [isOpen, currentVideoUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrlInput(e.target.value);
    if (e.target.value) {
      setVideoFile(null); // Clear file if URL is entered
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoUrlInput(''); // Clear URL if a file is chosen
      } else {
        toast({
          title: t('errorInvalidFileType'),
          description: t('errorSelectVideo'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!videoFile && !videoUrlInput) {
      toast({
        title: t('errorNoFileOrUrl'),
        description: t('errorSelectVideoOrUrl'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = videoUrlInput;
      
      if (videoFile) {
        const onProgress = (progress: number) => setUploadProgress(progress);
        finalVideoUrl = await uploadVideo(videoFile, onProgress, 'hero-videos');
      }
      
      await setContent(contentId, finalVideoUrl);
      
      onUpdate(finalVideoUrl);
      toast({
        title: t('videoUpdatedSuccessfully'),
      });
      onClose();

    } catch (error: any) {
      toast({
        title: t('errorUploadingVideo'),
        description: error.message || t('errorUnexpected'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setVideoFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      setVideoUrlInput(currentVideoUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{t('editHeroVideoTitle')}</DialogTitle>
          <DialogDescription>{t('editHeroVideoDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="video-url">{t('videoUrlLabel')}</Label>
            <Input id="video-url" type="url" placeholder="https://example.com/video.mp4" value={videoUrlInput} onChange={handleUrlChange} disabled={isUploading || !!videoFile} />
          </div>

          <div className="relative flex items-center justify-center w-full">
            <div className="absolute w-full border-t border-muted-foreground/20"></div>
            <span className="relative px-2 text-xs text-muted-foreground bg-card">{t('or')}</span>
          </div>

          <div>
            <Label htmlFor="video-upload">{t('selectNewVideo')}</Label>
            <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} disabled={isUploading || !!videoUrlInput} />
            {videoFile && <p className="text-sm text-muted-foreground mt-2">{t('videoFormSelected', { fileName: videoFile.name })}</p>}
          </div>

          {isUploading && videoFile && (
            <div className="space-y-1">
              <Label>{t('uploadingFile')}</Label>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isUploading}>
              {t('cancel')}
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isUploading || (!videoFile && !videoUrlInput)}>
            {isUploading ? t('saving') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
