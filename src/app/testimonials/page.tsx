
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCeremonies, getPublicTestimonials, Ceremony, Testimonial, UserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Video, Mic, MessageSquare } from 'lucide-react';
import { EditableTitle } from '@/components/home/EditableTitle';
import { EditableProvider } from '@/components/home/EditableProvider';

export default function TestimonialsPage() {
  const { t, i18n } = useTranslation();
  const [ceremoniesWithTestimonials, setCeremoniesWithTestimonials] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const testimonials = await getPublicTestimonials();
        const ceremonies = await getCeremonies();
        
        const ceremonyMap = new Map<string, Ceremony>();
        ceremonies.forEach(c => ceremonyMap.set(c.id, { ...c, testimonials: [] }));

        testimonials.forEach(testimonial => {
          const ceremony = ceremonyMap.get(testimonial.ceremonyId);
          if (ceremony) {
            ceremony.testimonials?.push(testimonial);
          }
        });
        
        const filteredAndSortedCeremonies = Array.from(ceremonyMap.values())
            .filter(c => c.testimonials && c.testimonials.length > 0)
            .sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        setCeremoniesWithTestimonials(filteredAndSortedCeremonies);

      } catch (error) {
        console.error("Failed to fetch testimonials or ceremonies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const getTestimonialIcon = (type: 'text' | 'audio' | 'video') => {
      switch(type) {
          case 'video': return <Video className="h-4 w-4 text-muted-foreground" />;
          case 'audio': return <Mic className="h-4 w-4 text-muted-foreground" />;
          default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      }
  }

  if (loading) {
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
        </div>
        
        {ceremoniesWithTestimonials.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={ceremoniesWithTestimonials[0]?.id} className="w-full max-w-4xl mx-auto space-y-4">
            {ceremoniesWithTestimonials.map(ceremony => (
              <AccordionItem key={ceremony.id} value={ceremony.id} className="border rounded-lg bg-card/50 backdrop-blur-sm px-4">
                <AccordionTrigger className="hover:no-underline">
                   <div className="flex flex-col text-left">
                     <h3 className="text-xl font-bold">{ceremony.title}</h3>
                     {ceremony.date && <p className="text-sm text-muted-foreground">{ceremony.date}</p>}
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4 border-t">
                    {ceremony.testimonials?.map(testimonial => (
                       <Card key={testimonial.id} className="overflow-hidden">
                           <CardHeader className="flex flex-row items-center gap-4 p-4 bg-muted/30">
                              <Avatar>
                                 <AvatarImage src={testimonial.userPhotoUrl || undefined} alt={testimonial.userName} />
                                 <AvatarFallback>{testimonial.userName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                 <p className="font-semibold">{testimonial.userName}</p>
                                 <p className="text-xs text-muted-foreground">{format(testimonial.createdAt, 'PPP', { locale })}</p>
                              </div>
                              {getTestimonialIcon(testimonial.type)}
                           </CardHeader>
                           <CardContent className="p-4">
                              <p className="text-foreground/80 italic">"{testimonial.content}"</p>
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

