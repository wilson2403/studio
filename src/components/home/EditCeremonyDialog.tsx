'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ceremony } from '@/types';
import { addCeremony, updateCeremony, deleteCeremony, uploadImage, uploadVideo } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useState } from 'react';
import { Progress } from '../ui/progress';
import { useTranslation } from 'react-i18next';

const formSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, t('errorRequired', { field: t('formTitle') })),
  description: z.string().min(1, t('errorRequired', { field: t('formDescription') })),
  price: z.string().min(1, t('errorRequired', { field: t('formPrice') })),
  link: z.string().url('Debe ser una URL válida'),
  featured: z.boolean(),
  features: z.array(z.object({ value: z.string().min(1, 'La característica no puede estar vacía') })),
  mediaUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  mediaType: z.enum(['image', 'video']).default('image'),
});

type EditCeremonyFormValues = z.infer<ReturnType<typeof formSchema>>;

interface EditCeremonyDialogProps {
  ceremony: Ceremony | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (ceremony: Ceremony) => void;
  onAdd: (ceremony: Ceremony) => void;
  onDelete: (id: string) => void;
  onDuplicate: (ceremony: Ceremony) => void;
}

export default function EditCeremonyDialog({ ceremony, isOpen, onClose, onUpdate, onAdd, onDelete, onDuplicate }: EditCeremonyDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditMode = !!ceremony;
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  const form = useForm<EditCeremonyFormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: isEditMode ? {
      title: ceremony.title,
      description: ceremony.description,
      price: ceremony.price,
      link: ceremony.link,
      featured: ceremony.featured,
      features: ceremony.features.map(f => ({ value: f })),
      mediaUrl: ceremony.mediaUrl || '',
      mediaType: ceremony.mediaType || 'image',
    } : {
      title: '',
      description: '',
      price: '',
      link: 'https://wa.me/50670519145',
      featured: false,
      features: [{ value: t('featureFood')}, {value: t('featureLodging')}],
      mediaUrl: '',
      mediaType: 'image',
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      form.setValue('mediaType', fileType);
      form.setValue('mediaUrl', ''); // Clear URL if a file is chosen
    }
  };


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  const onSubmit = async (data: EditCeremonyFormValues) => {
    if (!data.mediaUrl && !mediaFile) {
        toast({
           title: t('mediaRequired'),
           description: t('mediaRequiredDescription'),
           variant: 'destructive',
       });
       return;
   }

    setIsUploading(true);
    let finalMediaUrl = data.mediaUrl;

    if (mediaFile) {
        try {
            const onProgress = (progress: number) => setUploadProgress(progress);
            if(form.getValues('mediaType') === 'video') {
                finalMediaUrl = await uploadVideo(mediaFile, onProgress, 'ceremonies-videos');
            } else {
                finalMediaUrl = await uploadImage(mediaFile, onProgress);
            }
        } catch (error) {
            toast({
                title: 'Error de subida',
                description: 'No se pudo subir el archivo.',
                variant: 'destructive',
            });
            setIsUploading(false);
            return;
        }
    }

    try {
      const ceremonyData = { ...data, mediaUrl: finalMediaUrl, features: data.features.map(f => f.value) };
      
      if (isEditMode && ceremony) {
        const updatedData: Ceremony = {
          ...ceremony,
          ...ceremonyData,
        };
        await updateCeremony(updatedData);
        onUpdate(updatedData);
        toast({
          title: t('ceremonyUpdated'),
        });
      } else {
        const newData: Omit<Ceremony, 'id'> = {
           ...ceremonyData
        }
        const newId = await addCeremony(newData);
        onAdd({ ...newData, id: newId });
         toast({
          title: t('ceremonyCreated'),
        });
      }
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: t(isEditMode ? 'errorUpdatingCeremony' : 'errorCreatingCeremony'),
        variant: 'destructive',
      });
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setMediaFile(null);
    }
  };

  const handleDelete = async () => {
    if (!ceremony) return;
    try {
      await deleteCeremony(ceremony.id);
      onDelete(ceremony.id);
      toast({
        title: t('ceremonyDeleted'),
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: t('errorDeletingCeremony'),
        variant: 'destructive',
      });
    }
  }

  const handleDuplicate = async () => {
    if (!ceremony) return;
    try {
      const { id, ...originalData } = ceremony;
      const duplicatedData: Omit<Ceremony, 'id'> = {
        ...originalData,
        title: `${originalData.title} (Copia)`,
        featured: false, // Duplicates are not featured by default
      };
      const newId = await addCeremony(duplicatedData);
      onDuplicate({ ...duplicatedData, id: newId });
      toast({
        title: t('ceremonyDuplicated'),
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: t('errorDuplicatingCeremony'),
        variant: 'destructive',
      });
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setMediaFile(null);
          setIsUploading(false);
          setUploadProgress(0);
        }
        onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editCeremony') : t('addCeremonyTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editCeremonyDescription') : t('addCeremonyDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">{t('formTitle')}</Label>
            <Input id="title" {...form.register('title')} className="col-span-3" disabled={isUploading} />
             {form.formState.errors.title && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">{t('formDescription')}</Label>
            <Textarea id="description" {...form.register('description')} className="col-span-3" disabled={isUploading} />
            {form.formState.errors.description && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">{t('formPrice')}</Label>
            <Input id="price" {...form.register('price')} className="col-span-3" disabled={isUploading} />
            {form.formState.errors.price && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.price.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">{t('formLink')}</Label>
            <Input id="link" {...form.register('link')} className="col-span-3" disabled={isUploading} />
            {form.formState.errors.link && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.link.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mediaUrl" className="text-right">{t('formMediaUrl')}</Label>
            <Input id="mediaUrl" {...form.register('mediaUrl')} className="col-span-3" placeholder="https://youtube.com/watch?v=..." disabled={isUploading || !!mediaFile}/>
            {form.formState.errors.mediaUrl && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.mediaUrl.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="media-upload" className="text-right">{t('formOrUpload')}</Label>
             <div className="col-span-3">
                <Input id="media-upload" type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={isUploading || !!form.watch('mediaUrl')}/>
                {mediaFile && <p className="text-sm text-muted-foreground mt-1">{t('videoFormSelected', { fileName: mediaFile.name })}</p>}
             </div>
          </div>
          
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mediaType" className="text-right">{t('formMediaType')}</Label>
            <Select onValueChange={(value) => form.setValue('mediaType', value as 'image' | 'video')} defaultValue={form.getValues('mediaType')} disabled={isUploading || !!mediaFile}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('formSelectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">{t('formImageType')}</SelectItem>
                <SelectItem value="video">{t('formVideoType')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="features" className="text-right">{t('formFeatures')}</Label>
             <div className="col-span-3 space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`features.${index}.value`)} disabled={isUploading}/>
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={isUploading}><Trash className="h-4 w-4"/></Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })} disabled={isUploading}>
                    {t('formAddFeature')}
                </Button>
             </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="featured" className="text-right">{t('formFeatured')}</Label>
            <Checkbox id="featured" checked={form.watch('featured')} onCheckedChange={(checked) => form.setValue('featured', !!checked)} className="col-span-3 justify-self-start" disabled={isUploading}/>
          </div>
          
          {isUploading && (
            <div className='grid grid-cols-4 items-center gap-4'>
                <div className='col-start-2 col-span-3 space-y-1'>
                    <Label>{mediaFile ? t('uploadingFile') : t('saving')}</Label>
                    <Progress value={uploadProgress} />
                </div>
            </div>
           )}


          <DialogFooter className="justify-between">
            <div>
              {isEditMode && (
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isUploading}>
                        <Trash className="mr-2 h-4 w-4" />
                        {t('delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteCeremonyConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteCeremonyConfirmDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('continue')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button type="button" variant="outline" onClick={handleDuplicate} disabled={isUploading}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('duplicate')}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isUploading}>{t('cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                  {isUploading ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
