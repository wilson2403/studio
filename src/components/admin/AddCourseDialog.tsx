
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
import { Course } from '@/types';
import { addCourse, updateCourse, deleteCourse } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash } from 'lucide-react';

const formSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, t('errorRequired', { field: t('formTitle') })),
  description: z.string().min(1, t('errorRequired', { field: t('formDescription') })),
  videoUrl: z.string().url(t('errorInvalidUrl')),
  category: z.enum(['required', 'optional']),
});

type CourseFormValues = z.infer<ReturnType<typeof formSchema>>;

interface AddCourseDialogProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onAdd: (course: Course) => void;
  onUpdate: (course: Course) => void;
  onDelete: (id: string) => void;
}

export default function AddCourseDialog({ isOpen, course, onClose, onAdd, onUpdate, onDelete }: AddCourseDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditMode = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      title: '',
      description: '',
      videoUrl: '',
      category: 'required',
    },
  });

  useEffect(() => {
    if (course && isEditMode) {
      form.reset(course);
    } else {
      form.reset({
        title: '',
        description: '',
        videoUrl: '',
        category: 'required',
      });
    }
  }, [course, isEditMode, form]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
      if (isEditMode && course) {
        const updatedCourse = { ...course, ...data };
        await updateCourse(updatedCourse);
        onUpdate(updatedCourse);
        toast({ title: t('courseUpdatedSuccess') });
      } else {
        const newCourseId = await addCourse(data);
        const newCourse: Course = { id: newCourseId, createdAt: new Date() as any, ...data }; // Firestore timestamp will be set on server
        onAdd(newCourse);
        toast({ title: t('courseAddedSuccess') });
      }
      onClose();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    try {
        await deleteCourse(course.id);
        onDelete(course.id);
        toast({ title: t('courseDeletedSuccess') });
        onClose();
    } catch (error: any) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editCourse') : t('addCourse')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('editCourseDescription') : t('addCourseDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formTitle')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('videoUrlLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://youtube.com/watch?v=..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
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
                      <SelectItem value="required">{t('required')}</SelectItem>
                      <SelectItem value="optional">{t('optional')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='flex-col-reverse sm:flex-row sm:justify-between w-full pt-4'>
                <div>
                   {isEditMode && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                {t('delete')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('deleteCourseConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('deleteCourseConfirmDescription')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>{t('continue')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                   )}
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
