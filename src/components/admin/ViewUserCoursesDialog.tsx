
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourses, UserProfile, Course } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { CheckCircle, Circle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ViewUserCoursesDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewUserCoursesDialog({ user, isOpen, onClose }: ViewUserCoursesDialogProps) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchAllCourses() {
      if (isOpen) {
        setLoading(true);
        const allCourses = await getCourses();
        setCourses(allCourses);
        setCompletedCourses(user.completedCourses || []);
        setLoading(false);
      }
    }
    fetchAllCourses();
  }, [isOpen, user]);

  const requiredCourses = courses.filter(c => c.category === 'required');
  const optionalCourses = courses.filter(c => c.category === 'optional');
  
  const completedCount = completedCourses.length;
  const totalCount = courses.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('viewUserCoursesTitle', { name: user.displayName || user.email })}</DialogTitle>
           <DialogDescription>{t('viewUserCoursesProgress', { completed: completedCount, total: totalCount })}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 my-4">
          <div className="space-y-6 pr-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : courses.length > 0 ? (
                <>
                {requiredCourses.length > 0 && (
                    <div className='space-y-2'>
                        <h3 className="font-semibold">{t('requiredCourses')}</h3>
                        {requiredCourses.map(course => {
                            const isCompleted = completedCourses.includes(course.id);
                            return (
                                <div key={course.id} className="flex items-center space-x-3 rounded-md border p-3">
                                    {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="font-semibold">{course.title}</span>
                                        <span className="text-xs text-muted-foreground">{course.description}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                 {optionalCourses.length > 0 && (
                    <div className='space-y-2'>
                        <h3 className="font-semibold">{t('optionalCourses')}</h3>
                        {optionalCourses.map(course => {
                            const isCompleted = completedCourses.includes(course.id);
                            return (
                                <div key={course.id} className="flex items-center space-x-3 rounded-md border p-3">
                                    {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="font-semibold">{course.title}</span>
                                        <span className="text-xs text-muted-foreground">{course.description}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                </>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('noCoursesAvailable')}</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

