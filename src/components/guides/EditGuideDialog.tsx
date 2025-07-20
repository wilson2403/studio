
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Guide } from '@/types';
import { updateGuide, uploadImage } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Progress } from '../ui/progress';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

const formSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('errorRequired', { field: t('formName') })),
  description: z.string().min(1, t('errorRequired', { field: t('formDescription') })),
  imageUrl: z.string().url('Debe ser una URL válida').optional(),
});

type EditGuideFormValues = z.infer<ReturnType<typeof formSchema>>;

interface EditGuideDialogProps {
  guide: Guide | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (guide: Guide) => void;
}

export default function EditGuideDialog({ guide, isOpen, onClose, onUpdate }: EditGuideDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<EditGuideFormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      name: guide?.name || '',
      description: guide?.description || '',
      imageUrl: guide?.imageUrl || '',
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
    }
  };

  const onSubmit = async (data: EditGuideFormValues) => {
    if (!guide) return;
    setIsUploading(true);
    let finalImageUrl = guide.imageUrl;

    if (imageFile) {
        try {
            const onProgress = (progress: number) => setUploadProgress(progress);
            finalImageUrl = await uploadImage(imageFile, onProgress);
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
      const updatedData: Guide = {
        ...guide,
        ...data,
        imageUrl: finalImageUrl,
      };
      await updateGuide(updatedData);
      onUpdate(updatedData);
      toast({
        title: t('guideUpdated'),
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: t('errorUpdatingGuide'),
        variant: 'destructive',
      });
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setImageFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          form.reset({
            name: guide?.name,
            description: guide?.description,
            imageUrl: guide?.imageUrl
          });
          setImageFile(null);
          setIsUploading(false);
          setUploadProgress(0);
        }
        onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>{t('editGuideTitle')}</DialogTitle>
          <DialogDescription>
            {t('editGuideDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('formName')}</Label>
            <Input id="name" {...form.register('name')} className="col-span-3" disabled={isUploading} />
            {form.formState.errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">{t('formDescription')}</Label>
            <Textarea id="description" {...form.register('description')} className="col-span-3" rows={5} disabled={isUploading} />
            {form.formState.errors.description && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.description.message}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{t('formImage')}</Label>
            <div className='col-span-3 flex items-center gap-4'>
                <Image src={imageFile ? URL.createObjectURL(imageFile) : form.getValues('imageUrl') || 'https://placehold.co/160x160.png'} alt={form.getValues('name')} width={80} height={80} className='rounded-full object-cover' />
                <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading}/>
            </div>
          </div>
          
          {isUploading && (
            <div className='grid grid-cols-4 items-center gap-4'>
                <div className='col-start-2 col-span-3 space-y-1'>
                    <Label>{imageFile ? t('uploadingFile') : t('saving')}</Label>
                    <Progress value={uploadProgress} />
                </div>
            </div>
           )}

          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isUploading}>{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                {isUploading ? t('saving') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
