

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicTestimonials, Ceremony, Testimonial, deleteTestimonial, getAllTestimonialsForAdmin, updateTestimonialPublicStatus } from '@/lib/firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Video, Mic, MessageSquare, Star, Trash2 } from 'lucide-react';
import { EditableTitle } from '@/components/home/EditableTitle';
import { EditableProvider } from '@/components/home/EditableProvider';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import TestimonialDialog from '@/components/admin/TestimonialDialog';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function TestimonialsPage() {
  const { t, i18n } = useTranslation();
  const [ceremoniesWithTestimonials, setCeremoniesWithTestimonials] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const locale = i18n.language === 'es' ? es : enUS;
  const { toast } = useToast();

  const isAuthorized = userProfile?.role === 'admin' || userProfile?.role === 'organizer';

  const fetchTestimonials = async () => {
      setLoading(true);
      try {
        let testimonials: Testimonial[] = [];
        if (isAuthorized) {
            testimonials = await getAllTestimonialsForAdmin();
        } else {
            testimonials = await getPublicTestimonials();
        }
        
        const testimonialsByCeremonyId = testimonials.reduce((acc, testimonial) => {
            const { ceremonyId } = testimonial;
            if (!acc[ceremonyId]) {
                acc[ceremonyId] = [];
            }
            acc[ceremonyId].push(testimonial);
            return acc;
        }, {} as Record<string, Testimonial[]>);
        
        const ceremoniesArray = Object.entries(testimonialsByCeremonyId).map(([ceremonyId, tests]) => ({
            id: ceremonyId,
            title: tests[0]?.ceremonyTitle || ceremonyId, // Fallback to ID if title isn't stored on testimonial
            date: tests[0]?.ceremonyDate || '', // Assuming these might be on the testimonial
            testimonials: tests,
        })).sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        
        setCeremoniesWithTestimonials(ceremoniesArray as any);

      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
    if (!authLoading) {
        fetchTestimonials();
    }
  }, [authLoading, isAuthorized]);

  const getTestimonialIcon = (type: 'text' | 'audio' | 'video') => {
      switch(type) {
          case 'video': return <Video className="h-4 w-4 text-muted-foreground" />;
          case 'audio': return <Mic className="h-4 w-4 text-muted-foreground" />;
          default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      }
  }

  const renderStars = (rating: number) => {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
            ))}
        </div>
    );
  };
  
  const handleTogglePublic = async (testimonialId: string, currentStatus: boolean) => {
      try {
          await updateTestimonialPublicStatus(testimonialId, !currentStatus);
          toast({ title: t('testimonialStatusUpdated') });
          fetchTestimonials(); // Re-fetch to show updated state
      } catch (error) {
          toast({ title: t('errorUpdatingTestimonialStatus'), variant: 'destructive' });
      }
  }

  const handleDelete = async (testimonialId: string) => {
      try {
          await deleteTestimonial(testimonialId);
          toast({ title: t('testimonialDeletedSuccess') });
          fetchTestimonials();
      } catch (error) {
           toast({ title: t('testimonialDeletedError'), variant: 'destructive' });
      }
  };


  if (loading || authLoading) {
    return (
      <div className="container py-12 md:py-24 space-y-12">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <EditableProvider>
      <section className="container py-12 md:py-24">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <EditableTitle
              tag="h1"
              id="testimonialsPageTitle"
              initialValue={t('testimonialsPageTitle')}
              className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
          />
           <EditableTitle
              tag="p"
              id="testimonialsPageSubtitle"
              initialValue={t('testimonialsPageSubtitle')}
              className="max-w-2xl text-lg text-foreground/80 font-body"
          />
           {user && (
                <TestimonialDialog user={user}>
                    <Button>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className='flex-grow'>
                            <EditableTitle tag="span" id="leaveMyTestimonial" initialValue={t('leaveMyTestimonial')} />
                        </span>
                    </Button>
                </TestimonialDialog>
            )}
        </div>
        
        {ceremoniesWithTestimonials.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={ceremoniesWithTestimonials[0]?.id} className="w-full max-w-4xl mx-auto space-y-4">
            {ceremoniesWithTestimonials.map(ceremony => (
              <AccordionItem key={ceremony.id} value={ceremony.id} className="border rounded-lg bg-card/50 backdrop-blur-sm px-4">
                <AccordionTrigger className="hover:no-underline">
                   <div className="flex flex-col text-left">
                     <h3 className="text-xl font-bold">{ceremony.title}</h3>
                     {ceremony.date && <p className="text-sm text-muted-foreground">{format(new Date(ceremony.date), 'PPP', { locale })}</p>}
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4 border-t">
                    {ceremony.testimonials?.map(testimonial => (
                       <Card key={testimonial.id} className={cn("overflow-hidden transition-colors", !testimonial.isPublic && "bg-muted/50 border-dashed")}>
                           <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 bg-muted/30">
                              <div className='flex items-center gap-4'>
                                <Avatar>
                                   <AvatarImage src={testimonial.userPhotoUrl || undefined} alt={testimonial.userName} />
                                   <AvatarFallback>{testimonial.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <p className="font-semibold">{testimonial.userName}</p>
                                      {testimonial.rating && renderStars(testimonial.rating)}
                                   </div>
                                   <p className="text-xs text-muted-foreground">{format(testimonial.createdAt, 'PPP', { locale })}</p>
                                </div>
                              </div>
                               <div className='flex items-center gap-2'>
                                {getTestimonialIcon(testimonial.type)}
                                {isAuthorized && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`publish-${testimonial.id}`}
                                                checked={!!testimonial.isPublic}
                                                onCheckedChange={() => handleTogglePublic(testimonial.id, !!testimonial.isPublic)}
                                            />
                                            <Label htmlFor={`publish-${testimonial.id}`} className="text-xs">{t('public')}</Label>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('deleteTestimonialConfirmTitle')}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t('deleteTestimonialConfirmDescription')}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(testimonial.id)}>{t('delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                              </div>
                           </CardHeader>
                           <CardContent className="p-4 space-y-4">
                                {testimonial.type === 'text' && <p className="text-foreground/80 italic">"{testimonial.content}"</p>}
                                {testimonial.type === 'video' && (
                                    <div className="aspect-video relative rounded-md overflow-hidden">
                                        <VideoPlayer
                                            ceremonyId={testimonial.id}
                                            videoUrl={testimonial.content}
                                            mediaType="video"
                                            title={t('testimonialFrom', { name: testimonial.userName })}
                                            autoplay={false}
                                            defaultMuted={true}
                                        />
                                    </div>
                                )}
                                {testimonial.type === 'audio' && (
                                    <audio controls src={testimonial.content} className="w-full">
                                        {t('audioNotSupported')}
                                    </audio>
                                )}
                           </CardContent>
                       </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground">{t('noTestimonialsFound')}</p>
        )}
      </section>
    </EditableProvider>
  );
}
