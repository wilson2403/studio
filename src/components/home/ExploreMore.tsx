
'use client';

import { useTranslation } from 'react-i18next';
import { EditableTitle } from './EditableTitle';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight, Leaf, Sparkles, Users } from 'lucide-react';

export default function ExploreMore() {
    const { t } = useTranslation();

    const sections = [
        {
            id: 'medicine',
            icon: Leaf,
            title: 'exploreMedicineTitle',
            description: 'exploreMedicineDescription',
            link: '/ayahuasca',
            buttonText: 'exploreMedicineButton'
        },
        {
            id: 'guides',
            icon: Users,
            title: 'exploreGuidesTitle',
            description: 'exploreGuidesDescription',
            link: '/guides',
            buttonText: 'exploreGuidesButton'
        }
    ];

    return (
        <section className="container py-12 md:py-24">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                    tag="h2"
                    id="exploreMoreTitle"
                    initialValue={t('exploreMoreTitle')}
                    className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
            </div>
            <div className="grid md:grid-cols-2 gap-8 justify-center">
                {sections.map(section => (
                    <Card key={section.id} className="bg-card/50 backdrop-blur-sm flex flex-col text-center items-center p-6 max-w-sm">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <section.icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardHeader className="p-0">
                            <CardTitle className="text-2xl font-headline text-primary mb-2">
                                <EditableTitle id={section.title} tag="h3" initialValue={t(section.title)} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow">
                             <EditableTitle id={section.description} tag="p" initialValue={t(section.description)} className="text-foreground/80 font-body"/>
                        </CardContent>
                        <div className="pt-6 w-full">
                            <Button asChild className="w-full">
                                <Link href={section.link}>
                                    {t(section.buttonText)}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    )
}
