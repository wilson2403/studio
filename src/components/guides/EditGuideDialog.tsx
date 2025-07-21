
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
import { updateGuide, uploadImage, deleteGuide } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Progress } from '../ui/progress';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const formSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('errorRequired', { field: t('formName') })),
  description: z.string().min(1, t('errorRequired', { field: t('formDescription') })),
  imageUrl: z.string().url(t('errorInvalidUrl')).optional().or(z.literal('')),
});

type EditGuideFormValues = z.infer<ReturnType<typeof formSchema>>;

interface EditGuideDialogProps {
  guide: Guide | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (guide: Guide) => void;
  onDelete: (id: string) => void;
}

export default function EditGuideDialog({ guide, isOpen, onClose, onUpdate, onDelete }: EditGuideDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<EditGuideFormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (guide) {
      form.reset({
        name: guide.name,
        description: guide.description,
        imageUrl: guide.imageUrl,
      });
    }
  }, [guide, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      form.setValue('imageUrl', ''); // Clear URL if file is selected
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('imageUrl', e.target.value);
    if (e.target.value) {
      setImageFile(null); // Clear file if URL is typed
    }
  };

  const onSubmit = async (data: EditGuideFormValues) => {
    if (!guide) return;

    if (!data.imageUrl && !imageFile) {
      toast({
        title: t('mediaRequired'),
        description: t('mediaRequiredDescription'),
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    let finalImageUrl = data.imageUrl;

    try {
      if (imageFile) {
        const onProgress = (progress: number) => setUploadProgress(progress);
        finalImageUrl = await uploadImage(imageFile, onProgress);
      }

      const updatedData: Guide = {
        ...guide,
        ...data,
        imageUrl: finalImageUrl || guide.imageUrl,
      };

      await updateGuide(updatedData);
      onUpdate(updatedData);
      toast({
        title: t('guideUpdated'),
      });
      onClose();

    } catch (error: any) {
      toast({
        title: t('errorUpdatingGuide'),
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setImageFile(null);
    }
  };

  const handleDelete = async () => {
    if (!guide) return;
    try {
      await deleteGuide(guide.id);
      onDelete(guide.id);
      toast({
        title: t('guideDeleted'),
      });
      onClose();
    } catch (error: any) {
      toast({
        title: t('errorDeletingGuide'),
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset({
        name: guide?.name,
        description: guide?.description,
        imageUrl: guide?.imageUrl
      });
      setImageFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
    }
  }

  const imageUrl = form.watch('imageUrl');
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl || 'https://placehold.co/160x160.png';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>{t('editGuideTitle')}</DialogTitle>
          <DialogDescription>
            {t('editGuideDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t('formName')}</Label>
                    <FormControl>
                      <Input {...field} disabled={isUploading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t('formDescription')}</Label>
                    <FormControl>
                      <Textarea {...field} rows={5} disabled={isUploading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>{t('formImage')}</Label>
                <Image src={previewUrl} alt={form.getValues('name')} width={80} height={80} className='rounded-full object-cover' />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t('formImageUrl')}</Label>
                    <FormControl>
                       <Input 
                          {...field}
                          onChange={handleUrlChange}
                          placeholder="https://i.postimg.cc/..." 
                          disabled={isUploading || !!imageFile} 
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="relative flex items-center w-full">
                <div className="flex-grow border-t border-muted-foreground/20"></div>
                <span className="flex-shrink mx-4 text-xs text-muted-foreground">{t('or')}</span>
                <div className="flex-grow border-t border-muted-foreground/20"></div>
              </div>

              <div className="space-y-2">
                 <Label htmlFor="image-upload">{t('formUploadFile')}</Label>
                 <Input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isUploading || !!form.watch('imageUrl')}
                />
              </div>

              {isUploading && (
                <div className='space-y-1'>
                    <Label>{imageFile ? t('uploadingFile') : t('saving')}</Label>
                    <Progress value={uploadProgress} />
                </div>
              )}

              <DialogFooter className="flex justify-between w-full pt-4">
                <div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isUploading}>
                          <Trash className="mr-2 h-4 w-4" />
                          {t('delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('deleteGuideConfirmTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteGuideConfirmDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>{t('continue')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
