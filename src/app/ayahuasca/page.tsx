
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Heart, Globe, Users, User } from 'lucide-react';
import { EditableTitle } from '@/components/home/EditableTitle';
import { useTranslation } from 'react-i18next';
import { EditableProvider } from '@/components/home/EditableProvider';

export default function AyahuascaInfoPage() {
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
    <EditableProvider>
      <section id="ayahuasca-info" className="py-12 md:py-24 pl-10">
        <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in-0 duration-1000">
          <EditableTitle
              tag="h1"
              id="ayahuascaInfoTitle"
              initialValue={t('ayahuascaInfoTitle')}
              className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
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
          
          <div className="space-y-8 animate-in fade-in-0 duration-1000 delay-400">
               <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-2xl text-center">
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
                              <AccordionTrigger>
                                <div className="flex items-center gap-4 text-left">
                                  <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                                  <EditableTitle
                                    tag="p"
                                    id={title}
                                    initialValue={t(title)}
                                    className="flex-1 font-bold text-lg"
                                  />
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-10">
                                  <EditableTitle
                                      tag="p"
                                      id={description}
                                      initialValue={t(description)}
                                      className="text-base text-foreground/80"
                                  />
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                         ))}
                      </Accordion>
                  </CardContent>
               </Card>
               <div className='space-y-6'>
                  <div className='flex gap-4 items-start'>
                      <div className="p-3 bg-primary/10 rounded-full mt-1">
                          <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                          <EditableTitle
                              tag="h3"
                              id="groupCeremonyTitle"
                              initialValue={t('groupCeremonyTitle')}
                              className="text-2xl font-headline text-primary"
                          />
                          <EditableTitle
                              tag="p"
                              id="groupCeremonyDescription"
                              initialValue={t('groupCeremonyDescription')}
                              className="text-foreground/80 font-body text-lg mt-1"
                          />
                      </div>
                  </div>
                  <div className='flex gap-4 items-start'>
                      <div className="p-3 bg-primary/10 rounded-full mt-1">
                          <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                          <EditableTitle
                              tag="h3"
                              id="privateCeremonyTitle"
                              initialValue={t('privateCeremonyTitle')}
                              className="text-2xl font-headline text-primary"
                          />
                          <EditableTitle
                              tag="p"
                              id="privateCeremonyDescription"
                              initialValue={t('privateCeremonyDescription')}
                              className="text-foreground/80 font-body text-lg mt-1"
                          />
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </section>
    </EditableProvider>
  );
}
