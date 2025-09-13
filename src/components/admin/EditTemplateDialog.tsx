

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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash } from 'lucide-react';
import type { InvitationMessage, CeremonyInvitationMessage, ShareMemoryMessage } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type TemplateType = 'invitation' | 'ceremony' | 'share-memory';
type CombinedTemplate = (InvitationMessage | CeremonyInvitationMessage | ShareMemoryMessage) & { type: TemplateType };

const formSchema = (t: (key: string) => string) => z.object({
  id: z.string(),
  name: z.string().min(1, t('errorRequired')),
  es: z.string().min(1, t('errorRequired')),
  en: z.string().min(1, t('errorRequired')),
  type: z.enum(['invitation', 'ceremony', 'share-memory']),
});

type TemplateFormValues = z.infer<ReturnType<typeof formSchema>>;

interface EditTemplateDialogProps {
  isOpen: boolean;
  template: CombinedTemplate | null;
  originalTemplate: CombinedTemplate | null;
  onClose: () => void;
  onSave: (originalTemplate: CombinedTemplate, updatedTemplate: CombinedTemplate) => void;
  onDelete: (template: CombinedTemplate) => void;
}

export default function EditTemplateDialog({ isOpen, template, originalTemplate, onClose, onSave, onDelete }: EditTemplateDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(formSchema(t)),
  });

  useEffect(() => {
    if (template) {
      form.reset(template);
    }
  }, [template, form]);

  const onSubmit = (data: TemplateFormValues) => {
    if (originalTemplate) {
      onSave(originalTemplate, data);
    }
    onClose();
  };

  const handleDeleteClick = () => {
    if (template) {
      onDelete(template);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit')} {template?.name}</DialogTitle>
          <DialogDescription>{t('invitationTabDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('templateName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectCategory')} />
                          </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                           <SelectItem value="invitation">{t('templateType_invitation')}</SelectItem>
                           <SelectItem value="ceremony">{t('templateType_ceremony')}</SelectItem>
                           <SelectItem value="share-memory">{t('templateType_share-memory')}</SelectItem>
                       </SelectContent>
                   </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('templateMessageES')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6}/>
                  </FormControl>
                   {form.getValues('type') === 'ceremony' && <p className="text-xs text-muted-foreground mt-2">{t('placeholdersInfo')}</p>}
                   {form.getValues('type') === 'share-memory' && <p className="text-xs text-muted-foreground mt-2">{t('shareMemoryPlaceholdersInfo')}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('templateMessageEN')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6}/>
                  </FormControl>
                   {form.getValues('type') === 'ceremony' && <p className="text-xs text-muted-foreground mt-2">{t('placeholdersInfo')}</p>}
                   {form.getValues('type') === 'share-memory' && <p className="text-xs text-muted-foreground mt-2">{t('shareMemoryPlaceholdersInfo')}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full pt-4">
                <div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            {t('delete')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteTemplate')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('deleteTemplateConfirmDescription', { name: template?.name })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteClick}>{t('continue')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </div>
                <div className='flex gap-2'>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('saveChanges')}</Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
