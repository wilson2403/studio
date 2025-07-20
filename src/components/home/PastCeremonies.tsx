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
  updatePastCeremony
} from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '../ui/button';
import { Edit, PlusCircle, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (item) { // Edit
        const updatedItem = { ...item, title, description, videoUrl };
        await updatePastCeremony(updatedItem);
        onSave(updatedItem);
        toast({ title: 'Video actualizado' });
      } else { // Add
        const id = await addPastCeremony({ title, description, videoUrl });
        onSave({ id, title, description, videoUrl });
        toast({ title: 'Video añadido' });
      }
      onClose();
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="videoUrl">URL del Video</Label>
        <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required type="url" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  );
};

export default function PastCeremonies() {
  const [videos, setVideos] = React.useState<PastCeremony[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PastCeremony | undefined>(undefined);

  const isAdmin = user?.email === ADMIN_EMAIL;
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
      toast({ title: "Video eliminado" });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: 'destructive' });
    }
  }

  return (
    <section className="container py-12 md:py-24">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          Ceremonias Anteriores
        </h2>
        <p className="max-w-2xl text-lg text-foreground/80 font-body">
          Recuerda y revive los momentos de transformación de nuestros encuentros pasados.
        </p>
        {isAdmin && (
           <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(undefined)}>
                <PlusCircle className="mr-2" />
                Añadir Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Video' : 'Añadir Video'}</DialogTitle>
                <DialogDescription>
                  Completa los detalles del video de la ceremonia.
                </DialogDescription>
              </DialogHeader>
              <PastCeremonyForm item={editingItem} onSave={handleSave} onClose={() => {setFormOpen(false); setEditingItem(undefined)}} />
            </DialogContent>
          </Dialog>
        )}
      </div>

       {loading ? (
        <div className="flex justify-center">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-1">
                        <div className="relative rounded-2xl overflow-hidden aspect-video group bg-card/50 animate-pulse"></div>
                    </div>
                 ))}
            </div>
        </div>
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
              <div className="p-1">
                <div className="relative rounded-2xl overflow-hidden aspect-video group">
                   {isAdmin && (
                    <div className="absolute top-2 right-2 z-20 flex gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80" onClick={() => {setEditingItem(video); setFormOpen(true)}}>
                        <Edit className="h-4 w-4" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                             <AlertDialogDescription>
                              Esta acción eliminará el video permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(video.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  <video
                    src={video.videoUrl}
                    playsInline
                    loop
                    muted
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onMouseOver={event => (event.target as HTMLVideoElement).play()}
                    onMouseOut={event => (event.target as HTMLVideoElement).pause()}
                  />
                   <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
                   <div className="absolute bottom-0 left-0 p-6 text-white">
                      <h3 className="text-xl font-headline">{video.title}</h3>
                      <p className="font-body text-sm opacity-90">{video.description}</p>
                   </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex"/>
      </Carousel>
      )}
    </section>
  );
}
