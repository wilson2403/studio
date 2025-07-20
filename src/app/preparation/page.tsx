
'use client';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, HeartHandshake, Leaf, Minus, Sparkles, Sprout, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PreparationPage() {
    const { t } = useTranslation();

    const processSteps = [
        { id: "preparation", title: "preparationProcessTitle", description: "preparationProcessDescription", Icon: Sprout },
        { id: "ceremony", title: "ceremonyProcessTitle", description: "ceremonyProcessDescription", Icon: Sparkles },
        { id: "experience", title: "experienceProcessTitle", description: "experienceProcessDescription", Icon: Wind },
        { id: "integration", title: "integrationProcessTitle", description: "integrationProcessDescription", Icon: HeartHandshake },
    ];
    
    const mentalPrepSteps = [
        { title: "meditationTitle", description: "meditationDescription" },
        { title: "intentionsTitle", description: "intentionsDescription" },
        { title: "reflectionTitle", description: "reflectionDescription" },
    ];

    const comfortItems = t('comfortItemsList', { returnObjects: true }) as string[];
    const essentialItems = t('essentialsList', { returnObjects: true }) as string[];
    const allowedFoods = t('allowedFoodsList', { returnObjects: true }) as string[];
    const prohibitedFoods = t('prohibitedFoodsList', { returnObjects: true }) as string[];


    return (
        <EditableProvider>
            <div className="container py-12 md:py-24 space-y-16 md:space-y-24">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in-0 duration-1000">
                    <EditableTitle
                        tag="h1"
                        id="preparationPageTitle"
                        initialValue={t('preparationPageTitle')}
                        className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                    />
                </div>

                {/* Process Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {processSteps.map(({ id, title, description, Icon }) => (
                        <Card key={id} className="bg-card/50 backdrop-blur-sm text-center p-6 flex flex-col items-center animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-200">
                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                                <Icon className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-headline text-primary mb-2">
                                <EditableTitle id={title} tag="h3" initialValue={t(title)} />
                            </CardTitle>
                            <CardContent className="p-0">
                                <EditableTitle id={description} tag="p" initialValue={t(description)} className="text-foreground/80 font-body"/>
                            </CardContent>
                        </Card>
                     ))}
                </section>
                
                {/* Diet Section */}
                <section className="animate-in fade-in-0 duration-1000 delay-300">
                    <div className="text-center mb-12">
                        <EditableTitle id="dietTitle" tag="h2" initialValue={t('dietTitle')} className="text-3xl md:text-4xl font-headline text-primary" />
                        <EditableTitle id="dietSubtitle" tag="p" initialValue={t('dietSubtitle')} className="mt-2 text-lg text-foreground/80 font-body" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="bg-green-950/30 border-green-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-2xl font-headline text-green-400">
                                    <Leaf/>
                                    <EditableTitle id="allowedFoodsTitle" tag="h3" initialValue={t('allowedFoodsTitle')} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {allowedFoods.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                                            <span className="text-foreground/90">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                         <Card className="bg-red-950/30 border-red-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-2xl font-headline text-red-400">
                                    <Minus/>
                                    <EditableTitle id="prohibitedFoodsTitle" tag="h3" initialValue={t('prohibitedFoodsTitle')} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ul className="space-y-3">
                                    {prohibitedFoods.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Minus className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                                            <span className="text-foreground/90">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Mental Prep Section */}
                <section className="animate-in fade-in-0 duration-1000 delay-400">
                    <div className="text-center mb-12">
                        <EditableTitle id="mentalPrepTitle" tag="h2" initialValue={t('mentalPrepTitle')} className="text-3xl md:text-4xl font-headline text-primary" />
                        <EditableTitle id="mentalPrepSubtitle" tag="p" initialValue={t('mentalPrepSubtitle')} className="mt-2 text-lg text-foreground/80 font-body" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                       {mentalPrepSteps.map(step => (
                            <Card key={step.title} className="bg-card/50 backdrop-blur-sm text-center p-6">
                                <CardTitle className="font-headline text-primary">
                                    <EditableTitle id={step.title} tag="h3" initialValue={t(step.title)} />
                                </CardTitle>
                                <CardContent className="p-0 mt-2">
                                    <EditableTitle id={step.description} tag="p" initialValue={t(step.description)} className="text-foreground/80 font-body" />
                                </CardContent>
                            </Card>
                       ))}
                    </div>
                </section>
                
                {/* Emotional Healing Section */}
                <section className="text-center max-w-4xl mx-auto animate-in fade-in-0 duration-1000 delay-500">
                     <EditableTitle id="emotionalHealingTitle" tag="h2" initialValue={t('emotionalHealingTitle')} className="text-3xl md:text-4xl font-headline text-primary" />
                     <EditableTitle id="emotionalHealingDescription" tag="p" initialValue={t('emotionalHealingDescription')} className="mt-4 text-lg text-foreground/80 font-body" />
                </section>
                
                 {/* What to Bring Section */}
                <section className="animate-in fade-in-0 duration-1000 delay-600">
                    <div className="text-center mb-12">
                        <EditableTitle id="whatToBringTitle" tag="h2" initialValue={t('whatToBringTitle')} className="text-3xl md:text-4xl font-headline text-primary" />
                        <EditableTitle id="whatToBringSubtitle" tag="p" initialValue={t('whatToBringSubtitle')} className="mt-2 text-lg text-foreground/80 font-body" />
                    </div>
                    <Card className="bg-card/50 backdrop-blur-sm p-6 md:p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-2xl font-headline text-primary mb-4">
                                     <EditableTitle id="comfortItemsTitle" tag="h3" initialValue={t('comfortItemsTitle')} />
                                </h3>
                                <ul className="space-y-3">
                                    {comfortItems.map((item, i) => (
                                        <li key={i} className="flex gap-3 items-center">
                                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div>
                                <h3 className="text-2xl font-headline text-primary mb-4">
                                     <EditableTitle id="essentialsTitle" tag="h3" initialValue={t('essentialsTitle')} />
                                </h3>
                                <ul className="space-y-3">
                                     {essentialItems.map((item, i) => (
                                        <li key={i} className="flex gap-3 items-center">
                                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                </section>


            </div>
        </EditableProvider>
    )
}
