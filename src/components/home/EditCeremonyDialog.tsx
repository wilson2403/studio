
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
import { Ceremony, Plan } from '@/types';
import { addCeremony, updateCeremony, deleteCeremony, uploadImage, uploadVideo, resetCeremonyCounters } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Copy, PlusCircle, Trash, History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useState, useEffect } from 'react';
import { Progress } from '../ui/progress';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';

const planSchema = (t: (key: string, options?: any) => string) => z.object({
  name: z.string().min(1, t('errorRequired', { field: t('planName') })),
  description: z.string().min(1, t('errorRequired', { field: t('planDescription') })),
  price: z.coerce.number().min(0, t('errorPositiveNumber', { field: t('planPrice') })),
  priceUntil: z.coerce.number().optional(),
});

const formSchema = (t: (key: string, options?: any) => string) => z.object({
  title: z.string().min(1, t('errorRequired', { field: t('formTitle') })),
  description: z.string().min(1, t('errorRequired', { field: t('formDescription') })),
  price: z.coerce.number().min(0, t('errorPositiveNumber', { field: t('formPrice') })),
  priceType: z.enum(['exact', 'from']),
  link: z.string().url(t('errorInvalidUrl')).or(z.literal('')),
  featured: z.boolean(),
  features: z.array(z.object({ value: z.string().min(1, 'La característica no puede estar vacía') })),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video']).default('image'),
  videoFit: z.enum(['cover', 'contain']).default('cover'),
  autoplay: z.boolean().default(false),
  defaultMuted: z.boolean().default(true),
  plans: z.array(planSchema(t)).optional(),
  contributionText: z.string().optional(),
  status: z.enum(['active', 'finished', 'inactive']),
  date: z.string().optional(),
  horario: z.string().optional(),
  registerRequired: z.boolean().default(false),
  showParticipantCount: z.boolean().default(false),
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
    defaultValues: {
      title: '',
      description: '',
      price: 80000,
      priceType: 'from',
      link: 'https://wa.me/50687992560',
      featured: false,
      features: [{ value: t('featureFood')}, {value: t('featureLodging')}],
      mediaUrl: '',
      mediaType: 'image',
      videoFit: 'cover',
      autoplay: false,
      defaultMuted: true,
      plans: [{ name: 'Plan Básico', price: 80000, description: 'Descripción plan' }],
      contributionText: t('defaultContributionText'),
      status: 'active',
      date: '',
      horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰',
      registerRequired: false,
      showParticipantCount: false,
    },
  });
  
  useEffect(() => {
    if (ceremony && isEditMode) {
      form.reset({
        ...ceremony,
        features: ceremony.features.map(f => ({ value: f })),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        price: 80000,
        priceType: 'from',
        link: 'https://wa.me/50687992560',
        featured: false,
        features: [{ value: t('featureFood')}, {value: t('featureLodging')}],
        mediaUrl: '',
        mediaType: 'image',
        videoFit: 'cover',
        autoplay: false,
        defaultMuted: true,
        plans: [{ name: 'Plan Básico', price: 80000, description: 'Descripción plan' }],
        contributionText: t('defaultContributionText'),
        status: 'active',
        date: '',
        horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰',
        registerRequired: false,
        showParticipantCount: false,
      });
    }
  }, [ceremony, isEditMode, form, t]);


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
  
  const { fields: planFields, append: appendPlan, remove: removePlan } = useFieldArray({
    control: form.control,
    name: "plans"
  });

  const priceType = form.watch('priceType');

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
    let finalMediaType = data.mediaType;

    if (mediaFile) {
        finalMediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        try {
            const onProgress = (progress: number) => setUploadProgress(progress);
            if(finalMediaType === 'video') {
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
      const ceremonyData = { ...data, mediaUrl: finalMediaUrl, mediaType: finalMediaType, features: data.features.map(f => f.value) };
      if (ceremonyData.priceType === 'exact') {
        delete ceremonyData.plans;
      }
      
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

  const handleResetCounters = async () => {
    if (!ceremony) return;
    try {
        await resetCeremonyCounters(ceremony.id);
        onUpdate({ ...ceremony, viewCount: 0, reserveClickCount: 0, whatsappClickCount: 0 });
        toast({ title: t('countersResetSuccess') });
    } catch (error) {
        toast({ title: t('countersResetError'), variant: 'destructive' });
    }
  }

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      form.reset();
      setMediaFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md bg-card flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? t('editCeremony') : t('addCeremonyTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editCeremonyDescription') : t('addCeremonyDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mr-6 pr-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formTitle')}</FormLabel>
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
                                <FormLabel>{t('formDescription')}</FormLabel>
                                <FormControl>
                                    <Textarea {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formDate')}</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isUploading} placeholder="Ej: 24 de Julio, 2024" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="horario"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formSchedule')}</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} {...field} disabled={isUploading} placeholder="Ej: 4:00 p.m. – 7:00 a.m." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formPrice')}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priceType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formPriceType')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formSelectType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="exact">{t('priceTypeExact')}</SelectItem>
                                        <SelectItem value="from">{t('priceTypeFrom')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contributionText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formContributionText')}</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formLink')}</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="mediaUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formMediaUrl')}</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} {...field} placeholder="https://youtube.com/... o /videos/local.mp4" disabled={isUploading || !!mediaFile} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormItem>
                        <FormLabel>{t('formOrUpload')}</FormLabel>
                        <FormControl>
                        <Input id="media-upload" type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={isUploading || !!form.watch('mediaUrl')}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>

                    <FormField
                        control={form.control}
                        name="mediaType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formMediaType')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isUploading || !!mediaFile}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formSelectType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="image">{t('formImageType')}</SelectItem>
                                        <SelectItem value="video">{t('formVideoType')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="videoFit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formVideoFit')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isUploading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formSelectFit')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="cover">{t('videoFitCover')}</SelectItem>
                                        <SelectItem value="contain">{t('videoFitContain')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('formFeatured')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="registerRequired"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('formRegisterRequired')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="showParticipantCount"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('formShowParticipantCount')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="autoplay"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('formAutoplay')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                         <FormField
                            control={form.control}
                            name="defaultMuted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={!field.value}
                                            onCheckedChange={(checked) => field.onChange(!checked)}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('formDefaultAudio')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div>
                        <Label>{t('formFeatures')}</Label>
                        <div className="space-y-2 mt-2">
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

                    {priceType === 'from' && (
                        <div>
                            <Label className="text-lg font-semibold">{t('plansTitle')}</Label>
                            <div className="space-y-4 mt-2">
                                {planFields.map((field, index) => (
                                    <div key={field.id} className="space-y-3 p-4 border rounded-md relative bg-muted/50">
                                        <div className="absolute top-2 right-2">
                                            <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removePlan(index)} disabled={isUploading}><Trash className="h-4 w-4"/></Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`plans.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('planName')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={isUploading} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`plans.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('planDescription')}</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} disabled={isUploading} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`plans.${index}.price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('planPriceFrom')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} disabled={isUploading} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`plans.${index}.priceUntil`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('planPriceUntil')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} disabled={isUploading} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendPlan({ name: '', description: '', price: 0 })} disabled={isUploading}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('addPlan')}
                                </Button>
                            </div>
                        </div>
                    )}
            
                    {isUploading && (
                        <div className='space-y-1'>
                            <Label>{mediaFile ? t('uploadingFile') : t('saving')}</Label>
                            <Progress value={uploadProgress} />
                        </div>
                    )}

                    {isEditMode && <Separator className="my-4" />}

                    {isEditMode && ceremony && (
                        <div className='space-y-4'>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('status')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('formSelectStatus')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">{t('statusActive')}</SelectItem>
                                                <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
                                                <SelectItem value="finished">{t('statusFinished')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" size="icon" disabled={isUploading}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('deleteCeremonyConfirmTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>{t('deleteCeremonyConfirmDescription')}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button type="button" variant="outline" size="sm" onClick={handleDuplicate} disabled={isUploading}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    {t('duplicate')}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="outline" size="sm" disabled={isUploading}>
                                            <History className="mr-2 h-4 w-4" />
                                            {t('resetCounters')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('resetCountersConfirmTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>{t('resetCountersConfirmDescription')}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetCounters}>{t('continue')}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end w-full pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isUploading}>{t('cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                            {isUploading ? t('saving') : t('saveChanges')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

