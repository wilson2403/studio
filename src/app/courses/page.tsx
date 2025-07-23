
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getCourses, getUserProfile, updateUserCompletedCourses, Course, UserProfile } from '@/lib/firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, Edit, PlusCircle, Trash, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddCourseDialog from '@/components/admin/AddCourseDialog';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function CoursesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
                setIsAdmin(!!profile?.isAdmin || currentUser.email === ADMIN_EMAIL);
            } else {
                router.push('/login?redirect=/courses');
            }
            setLoading(false);
        });

        const fetchCourses = async () => {
            const allCourses = await getCourses();
            setCourses(allCourses);
        };
        
        fetchCourses();

        return () => unsubscribe();
    }, [router]);

    const handleCourseCompletionToggle = async (courseId: string, isCompleted: boolean) => {
        if (!user) return;
        try {
            await updateUserCompletedCourses(user.uid, courseId, isCompleted);
            setUserProfile(prev => ({
                ...prev!,
                completedCourses: isCompleted
                    ? [...(prev?.completedCourses || []), courseId]
                    : (prev?.completedCourses || []).filter(id => id !== courseId)
            }));
            toast({ title: t('progressUpdated') });
        } catch (error) {
            toast({ title: t('errorUpdatingProgress'), variant: 'destructive' });
        }
    };
    
    const handleAddOrUpdateCourse = (course: Course) => {
        setCourses(prev => {
            const index = prev.findIndex(c => c.id === course.id);
            if (index > -1) {
                const newCourses = [...prev];
                newCourses[index] = course;
                return newCourses;
            }
            return [course, ...prev];
        });
    }

    const handleDeleteCourse = (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
    }


    if (loading) {
        return (
             <div className="container py-12 md:py-16 space-y-12">
                <Skeleton className="h-12 w-1/3 mx-auto" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>{t('authRequiredCoursesTitle')}</CardTitle>
                        <CardDescription>{t('authRequiredCoursesDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Button asChild className="w-full">
                            <Link href="/login?redirect=/courses">{t('signIn')}</Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/register?redirect=/courses">{t('registerButton')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const requiredCourses = courses.filter(c => c.category === 'required');
    const optionalCourses = courses.filter(c => c.category === 'optional');

    const renderCourseList = (list: Course[], title: string) => (
        <div className="space-y-8">
            <h2 className="text-3xl font-headline text-primary">{title}</h2>
            {list.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
                    {list.map(course => {
                        const isCompleted = userProfile?.completedCourses?.includes(course.id) || false;
                        return (
                            <Card key={course.id} className="overflow-hidden">
                                <div className="aspect-video relative">
                                    <VideoPlayer ceremonyId={course.id} videoUrl={course.videoUrl} mediaType="video" title={course.title} defaultMuted={false}/>
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    <div className='flex justify-between items-start'>
                                        <h3 className="text-xl font-bold">{course.title}</h3>
                                        {isAdmin && (
                                            <Button variant="ghost" size="icon" onClick={() => setEditingCourse(course)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm">{course.description}</p>
                                    <div className='flex items-center justify-between pt-2 border-t'>
                                         <div className='flex items-center space-x-2'>
                                            <Switch
                                                id={`completed-${course.id}`}
                                                checked={isCompleted}
                                                onCheckedChange={(checked) => handleCourseCompletionToggle(course.id, checked)}
                                            />
                                            <Label htmlFor={`completed-${course.id}`}>{t('markAsSeen')}</Label>
                                         </div>
                                         {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <p className="text-muted-foreground">{t('noCoursesInCategory')}</p>
            )}
        </div>
    );

    return (
        <div className="container py-12 md:py-16 space-y-12 pl-5">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">{t('navCourses')}</h1>
                <p className="text-lg text-foreground/80 font-body max-w-2xl mx-auto">{t('coursesDescription')}</p>
                 {isAdmin && (
                    <Button onClick={() => setIsAddingCourse(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addCourse')}
                    </Button>
                )}
            </div>

            {renderCourseList(requiredCourses, t('requiredCourses'))}
            {renderCourseList(optionalCourses, t('optionalCourses'))}

            {(isAddingCourse || editingCourse) && (
                 <AddCourseDialog
                    isOpen={isAddingCourse || !!editingCourse}
                    course={editingCourse}
                    onClose={() => {
                        setIsAddingCourse(false);
                        setEditingCourse(null);
                    }}
                    onAdd={handleAddOrUpdateCourse}
                    onUpdate={handleAddOrUpdateCourse}
                    onDelete={handleDeleteCourse}
                 />
            )}
        </div>
    );
}
