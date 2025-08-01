
'use client';

import { Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EditableTitle } from "./EditableTitle";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { WhatsappIcon } from "../icons/WhatsappIcon";
import { useEditable } from "./EditableProvider";
import { useEffect, useState } from "react";
import { FacebookIcon } from "../icons/FacebookIcon";
import { TikTokIcon } from "../icons/TikTokIcon";
import { getSystemSettings } from "@/ai/flows/settings-flow";
import { SystemSettings } from "@/types";

export default function Contact() {
    const { t, i18n } = useTranslation();
    const { content, fetchContent } = useEditable();
    
    const initialValues = {
        whatsappCommunityLink: 'https://chat.whatsapp.com/BC9bfrXVZdYL0kti2Ox1bQ',
        instagramUrl: 'https://www.instagram.com/elartedesanarcr',
        facebookUrl: 'https://www.facebook.com/profile.php?id=61574627625274',
        tiktokUrl: 'https://www.tiktok.com/@elartedesanarcr',
        whatsappNumber: '50687992560'
    };
    
    const [communityLink, setCommunityLink] = useState(initialValues.whatsappCommunityLink);
    const [instagramUrl, setInstagramUrl] = useState(initialValues.instagramUrl);
    const [facebookUrl, setFacebookUrl] = useState(initialValues.facebookUrl);
    const [tiktokUrl, setTiktokUrl] = useState(initialValues.tiktokUrl);
    const [whatsappNumber, setWhatsappNumber] = useState(initialValues.whatsappNumber);
    const [componentButtons, setComponentButtons] = useState<SystemSettings['componentButtons'] | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                setComponentButtons(settings.componentButtons);
            } catch (error) {
                console.error("Failed to fetch button settings:", error);
            }
        };
        fetchSettings();

        Object.entries(initialValues).forEach(([id, fallback]) => {
            fetchContent(id, fallback);
        });
    }, [fetchContent]);

    useEffect(() => {
        const getStringValue = (id: string, fallback: string) => {
            const value = content[id];
            if (typeof value === 'object' && value !== null) {
                return (value as any).es || fallback;
            }
            return (value as string) || fallback;
        };

        setCommunityLink(getStringValue('whatsappCommunityLink', initialValues.whatsappCommunityLink));
        setInstagramUrl(getStringValue('instagramUrl', initialValues.instagramUrl));
        setFacebookUrl(getStringValue('facebookUrl', initialValues.facebookUrl));
        setTiktokUrl(getStringValue('tiktokUrl', initialValues.tiktokUrl));
        setWhatsappNumber(getStringValue('whatsappNumber', initialValues.whatsappNumber));

    }, [content]);

    const getButtonLabel = (key: keyof SystemSettings['componentButtons']) => {
        if (!componentButtons) return t('componentButtonWhatsappCommunityButton');
        const lang = i18n.language as 'es' | 'en';
        const label = componentButtons[key];
        if (label && typeof label === 'object') {
            return label[lang] || label.es;
        }
        return t('componentButtonWhatsappCommunityButton');
    };

    const whatsappContactUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, vengo de la página web y quisiera más información sobre El Arte de Sanar')}`;

    return (
        <section id="contact" className="container py-8 md:py-16">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                    tag="h2"
                    id="contactTitle"
                    initialValue={t('contactTitle')}
                    className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                 <EditableTitle
                    tag="p"
                    id="contactCommunityText"
                    initialValue={t('contactCommunityText')}
                    className="text-lg text-foreground/80 font-body max-w-3xl"
                />
            </div>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                <Card className="bg-card/50 backdrop-blur-sm p-6 text-center flex flex-col items-center justify-between max-w-sm w-full">
                     <h3 className="text-2xl font-headline text-primary mb-2">
                         El Arte de Sanar
                     </h3>
                     <p className="text-sm text-muted-foreground mb-4">San Carlos & Guanacaste</p>
                     <CardContent className="p-0 flex-grow flex flex-col items-center justify-center w-full">
                        <div className="flex justify-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={instagramUrl} target="_blank">
                                    <Instagram />
                                </Link>
                            </Button>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={facebookUrl} target="_blank">
                                    <FacebookIcon />
                                </Link>
                            </Button>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={tiktokUrl} target="_blank">
                                    <TikTokIcon />
                                </Link>
                            </Button>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={whatsappContactUrl} target="_blank">
                                    <WhatsappIcon />
                                </Link>
                            </Button>
                        </div>
                     </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm p-6 text-center flex flex-col items-center justify-between max-w-sm w-full">
                    <CardContent className="p-0 flex-grow flex flex-col items-center justify-center w-full">
                        <EditableTitle
                            tag="p"
                            id="whatsappCommunityTitle"
                            initialValue={t('whatsappCommunityTitle')}
                            className="text-lg text-foreground/80 font-body mb-4"
                        />
                        {communityLink && (
                            <Button asChild>
                                <Link href={communityLink} target="_blank">
                                    <WhatsappIcon className="mr-2" />
                                    {getButtonLabel('whatsappCommunityButton')}
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
