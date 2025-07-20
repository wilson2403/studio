
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Heart, Globe } from 'lucide-react';
import { EditableTitle } from './EditableTitle';
import { useTranslation } from 'react-i18next';

export default function AyahuascaInfo() {
  const { t } = useTranslation();

  const benefits = [
    {
      id: 'benefitClarity',
      title: 'ayahuascaBenefitClarityTitle',
      description: 'ayahuascaBenefitClarityDescription',
      Icon: Leaf,
    },
    {
      id: 'benefitHealing',
      title: 'ayahuascaBenefitHealingTitle',
      description: 'ayahuascaBenefitHealingDescription',
      Icon: Heart,
    },
    {
      id: 'benefitConnection',
      title: 'ayahuascaBenefitConnectionTitle',
      description: 'ayahuascaBenefitConnectionDescription',
      Icon: Globe,
    },
  ];

  return (
    <section id="ayahuasca-info" className="container py-12 md:py-24">
      <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in-0 duration-1000">
        <EditableTitle
            tag="h2"
            id="ayahuascaInfoTitle"
            initialValue={t('ayahuascaInfoTitle')}
            className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-in fade-in-0 duration-1000 delay-200">
            <div className='space-y-2'>
                 <EditableTitle
                    tag="h3"
                    id="whatIsAyahuascaTitle"
                    initialValue={t('whatIsAyahuascaTitle')}
                    className="text-2xl font-headline text-primary"
                />
                 <EditableTitle
                    tag="p"
                    id="whatIsAyahuascaDescription"
                    initialValue={t('whatIsAyahuascaDescription')}
                    className="text-foreground/80 font-body text-lg"
                />
            </div>
             <div className='space-y-2'>
                 <EditableTitle
                    tag="h3"
                    id="howAyahuascaWorksTitle"
                    initialValue={t('howAyahuascaWorksTitle')}
                    className="text-2xl font-headline text-primary"
                />
                 <EditableTitle
                    tag="p"
                    id="howAyahuascaWorksDescription"
                    initialValue={t('howAyahuascaWorksDescription')}
                    className="text-foreground/80 font-body text-lg"
                />
            </div>
             <div className='space-y-2'>
                 <EditableTitle
                    tag="h3"
                    id="spiritualMasterTitle"
                    initialValue={t('spiritualMasterTitle')}
                    className="text-2xl font-headline text-primary"
                />
                 <EditableTitle
                    tag="p"
                    id="spiritualMasterDescription"
                    initialValue={t('spiritualMasterDescription')}
                    className="text-foreground/80 font-body text-lg"
                />
            </div>
        </div>
        
        <div className="animate-in fade-in-0 duration-1000 delay-400">
             <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">
                         <EditableTitle
                            tag="h3"
                            id="ceremonyBenefitsTitle"
                            initialValue={t('ceremonyBenefitsTitle')}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible defaultValue="benefitClarity" className="w-full">
                       {benefits.map(({ id, title, description, Icon }) => (
                           <AccordionItem key={id} value={id}>
                               <AccordionTrigger className="text-lg font-bold hover:no-underline">
                                   <div className="flex items-center gap-4">
                                       <Icon className="h-6 w-6 text-primary" />
                                       <EditableTitle
                                            tag="p"
                                            id={`${id}Title`}
                                            initialValue={t(title)}
                                       />
                                   </div>
                               </AccordionTrigger>
                               <AccordionContent className="text-base text-foreground/80 pl-10">
                                   <EditableTitle
                                        tag="p"
                                        id={`${id}Description`}
                                        initialValue={t(description)}
                                   />
                               </AccordionContent>
                           </AccordionItem>
                       ))}
                    </Accordion>
                </CardContent>
             </Card>
        </div>
      </div>
    </section>
  );
}
