
'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  addPastCeremony,
  deletePastCeremony,
  getPastCeremonies,
  PastCeremony,
  seedPastCeremonies,
  updatePastCeremony,
  uploadVideo,
} from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useEditable } from './EditableProvider';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '../ui/button';
import { Copy, Edit, ExternalLink, PlusCircle, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Progress } from '../ui/progress';
import { VideoPlayer } from './VideoPlayer';
import { EditableTitle } from './EditableTitle';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const PastCeremonyForm = ({
  item,
  onSave,
  onClose,
}: {
  item?: PastCeremony;
  onSave: (data: PastCeremony) => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = React.useState(item?.title || '');
  const [description, setDescription] = React.useState(item?.description || '');
  const [videoUrl, setVideoUrl] = React.useState(item?.videoUrl || '');
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoUrl(''); // Clear URL if a file is chosen
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl && !videoFile) {
        toast({ title: t('videoFormUrlOrUpload'), variant: 'destructive' });
        return;
    }

    setUploading(true);

    try {
      let finalVideoUrl = videoUrl;
      
      if (videoFile) {
          finalVideoUrl = await uploadVideo(videoFile, (progress) => {
              setUploadProgress(progress);
          });
      }

      if (!finalVideoUrl) {
          toast({ title: t('errorSavingVideo'), description: 'No se pudo obtener la URL del video.', variant: 'destructive' });
          setUploading(false);
          return;
      }
      
      const ceremonyData = { title, description, videoUrl: finalVideoUrl };

      if (item) { // Edit
        const updatedItem = { ...item, ...ceremonyData };
        await updatePastCeremony(updatedItem);
        onSave(updatedItem);
        toast({ title: t('videoUpdated') });
      } else { // Add
        const id = await addPastCeremony(ceremonyData);
        onSave({ id, ...ceremonyData });
        toast({ title: t('videoAdded') });
      }
      onClose();
    } catch (error) {
      console.error("Error during submit:", error);
      toast({ title: t('errorSavingVideo'), variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">{t('videoFormTitle')}</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">{t('videoFormDescription')}</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="videoUrl">{t('videoFormUrl')}</Label>
        <Input id="videoUrl" value={videoUrl} onChange={(e) => {setVideoUrl(e.target.value); setVideoFile(null)}} type="url" placeholder="https://youtube.com/watch?v=..." />
      </div>

      <div className="relative flex items-center justify-center w-full">
        <div className="absolute w-full border-t border-muted-foreground/20"></div>
        <span className="relative px-2 text-xs text-muted-foreground bg-card">{t('or')}</span>
      </div>

      <div className="space-y-2">
         <Label htmlFor="videoFile">{t('videoFormUpload')}</Label>
         <div className="flex items-center gap-2">
          <Input id="videoFile" type="file" accept="video/*" onChange={handleFileChange} className="flex-grow"/>
         </div>
         {videoFile && <p className="text-sm text-muted-foreground">{t('videoFormSelected', { fileName: videoFile.name })}</p>}
      </div>

      {uploading && (
        <div className='space-y-1'>
           <Label>{videoFile ? t('videoFormUploading') : t('videoFormSaving')}</Label>
           <Progress value={uploadProgress} />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={uploading}>{t('cancel')}</Button>
        <Button type="submit" disabled={uploading}>
            {uploading ? t('videoFormSaving') : t('videoFormSave')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default function PastCeremonies() {
    const { t } = useTranslation();
    const { isAdmin } = useEditable();
    const [videos, setVideos] = React.useState<PastCeremony[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [user, setUser] = React.useState<User | null>(null);
    const [isFormOpen, setFormOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<PastCeremony | undefined>(undefined);

    const { toast } = useToast();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            let data = await getPastCeremonies();
            if (data.length === 0) {
                await seedPastCeremonies();
                data = await getPastCeremonies();
            }
            setVideos(data);
            setLoading(false);
        };
        fetchVideos();
    }, []);

    const handleSave = (savedItem: PastCeremony) => {
        if (videos.find(v => v.id === savedItem.id)) {
        setVideos(videos.map(v => v.id === savedItem.id ? savedItem : v));
        } else {
        setVideos([...videos, savedItem]);
        }
        setFormOpen(false);
        setEditingItem(undefined);
    }

    const handleDelete = async (id: string) => {
        try {
        await deletePastCeremony(id);
        setVideos(videos.filter(v => v.id !== id));
        toast({ title: t("videoDeleted") });
        } catch (error) {
        toast({ title: t("errorDeletingVideo"), variant: 'destructive' });
        }
    }

    const handleDuplicate = async (itemToDuplicate: PastCeremony) => {
        try {
        const { id, ...originalData } = itemToDuplicate;
        const duplicatedData: Omit<PastCeremony, 'id'> = {
            ...originalData,
            title: `${originalData.title} (Copia)`,
        };
        const newId = await addPastCeremony(duplicatedData);
        setVideos([...videos, { ...duplicatedData, id: newId }]);
        toast({ title: t("videoDuplicated") });
        } catch (error) {
        toast({ title: t("errorDuplicatingVideo"), variant: 'destructive' });
        }
    };

    return (
        <section className="container py-12 md:py-24 animate-in fade-in-0 duration-1000 delay-500">
             <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                tag="h2"
                id="pastCeremoniesTitle"
                initialValue={t('pastCeremoniesTitle')}
                className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                <EditableTitle
                tag="p"
                id="pastCeremoniesSubtitle"
                initialValue={t('pastCeremoniesSubtitle')}
                className="max-w-2xl text-lg text-foreground/80 font-body"
                />
            </div>
            <div className="relative w-full max-w-7xl mx-auto">
            {isAdmin && (
                <div className="absolute -top-12 right-0 z-30 flex gap-2">
                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    if (!open) {
                        setEditingItem(undefined);
                    }
                    setFormOpen(open);
                }}>
                    <DialogTrigger asChild>
                    <Button onClick={() => {setEditingItem(undefined); setFormOpen(true);}}>
                        <PlusCircle className="mr-2" />
                        {t('addVideo')}
                    </Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? t('editVideo') : t('addVideo')}</DialogTitle>
                        <DialogDescription>
                        {t('addVideoDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <PastCeremonyForm item={editingItem} onSave={handleSave} onClose={() => {setFormOpen(false); setEditingItem(undefined)}} />
                    </DialogContent>
                </Dialog>
                </div>
            )}
            {loading ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card animate-pulse"></div>
            ) : (
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent>
                    {videos.map((video) => (
                        <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1 md:p-2">
                            <div className="relative rounded-2xl overflow-hidden aspect-video group shadow-2xl shadow-primary/20 border-2 border-primary/30">
                            {isAdmin && (
                                <div className="absolute top-2 right-2 z-20 flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={() => {setEditingItem(video); setFormOpen(true)}}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={() => handleDuplicate(video)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('deleteVideoConfirmTitle')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        {t('deleteVideoConfirmDescription')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(video.id)}>{t('delete')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            )}
                            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 left-2 z-20">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                            <VideoPlayer 
                                videoUrl={video.videoUrl} 
                                title={video.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-all duration-300"></div>
                            <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white transition-all duration-300 transform-gpu translate-y-1/4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 text-left">
                                <h3 className="text-lg md:text-xl font-headline">{video.title}</h3>
                                <p className="font-body text-sm opacity-90 mt-1">{video.description}</p>
                            </div>
                            </div>
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-[-1rem] md:left-4" />
                    <CarouselNext className="right-[-1rem] md:right-4"/>
                </Carousel>
            )}
            </div>
      </section>
    );
}
