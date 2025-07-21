
'use client';

import { Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EditableTitle } from "./EditableTitle";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { WhatsappIcon } from "../icons/WhatsappIcon";

export default function Contact() {
    const { t } = useTranslation();

    const contacts = [
        {
            id: 'sanCarlos',
            title: t('contactSanCarlosTitle'),
            handle: '@ElArteDeSanarcr',
            instagramUrl: 'https://www.instagram.com/elartedesanarcr',
            whatsappUrl: 'https://wa.me/50687992560?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quisiera%20más%20información%20sobre%20El%20Arte%20de%20Sanar%20en%20San%20Carlos'
        },
        {
            id: 'guanacaste',
            title: t('contactGuanacasteTitle'),
            handle: '@CasaTrinitos',
            instagramUrl: 'https://www.instagram.com/casatrinitos',
            whatsappUrl: 'https://wa.me/50687992560?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quisiera%20más%20información%20sobre%20Casa%20Trinitos%20en%20Guanacaste'
        }
    ];

    return (
        <section id="contact" className="container py-8 md:py-16">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                    tag="h2"
                    id="contactTitle"
                    initialValue={t('contactTitle')}
                    className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {contacts.map(contact => (
                    <Card key={contact.id} className="bg-card/50 backdrop-blur-sm p-6 text-center flex flex-col items-center justify-between">
                         <h3 className="text-2xl font-headline text-primary mb-2">
                             {contact.title}
                         </h3>
                         <CardContent className="p-0 flex-grow flex flex-col items-center justify-center">
                            <p className="font-body text-base text-foreground/80">{t('followUsText')}</p>
                            <Button variant="link" asChild>
                                <Link href={contact.instagramUrl} target="_blank" className="text-lg">
                                    <Instagram className="mr-2" />
                                    {contact.handle}
                                </Link>
                            </Button>
                             <p className="font-body text-base text-foreground/80 mt-4">{t('writeToUsText')}</p>
                             <Button variant="link" asChild>
                                <Link href={contact.whatsappUrl} target="_blank" className="text-lg">
                                    <WhatsappIcon className="mr-2" />
                                    WhatsApp
                                </Link>
                            </Button>
                         </CardContent>
                    </Card>
                ))}
            </div>

            <div className="max-w-3xl mx-auto text-center">
                 <EditableTitle
                    tag="p"
                    id="contactCommunityText"
                    initialValue={t('contactCommunityText')}
                    className="text-lg text-foreground/80 font-body"
                />
            </div>
        </section>
    );
}
