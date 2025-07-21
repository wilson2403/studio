
'use client';

import { Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EditableTitle } from "./EditableTitle";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { WhatsappIcon } from "../icons/WhatsappIcon";
import { FacebookIcon } from "../icons/FacebookIcon";

export default function Contact() {
    const { t } = useTranslation();

    const socialLinks = {
        instagramUrl: 'https://www.instagram.com/elartedesanarcr',
        facebookUrl: 'https://www.facebook.com/profile.php?id=61574627625274',
        whatsappUrl: 'https://wa.me/50687992560?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quisiera%20más%20información%20sobre%20El%20Arte%20de%20Sanar'
    };

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
            
            <div className="flex justify-center mb-12">
                <Card className="bg-card/50 backdrop-blur-sm p-6 text-center flex flex-col items-center justify-between max-w-sm w-full">
                     <h3 className="text-2xl font-headline text-primary mb-2">
                         El Arte de Sanar
                     </h3>
                     <p className="text-sm text-muted-foreground mb-4">San Carlos & Guanacaste</p>
                     <CardContent className="p-0 flex-grow flex flex-col items-center justify-center w-full">
                        <div className="flex justify-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={socialLinks.instagramUrl} target="_blank">
                                    <Instagram />
                                </Link>
                            </Button>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={socialLinks.facebookUrl} target="_blank">
                                    <FacebookIcon />
                                </Link>
                            </Button>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={socialLinks.whatsappUrl} target="_blank">
                                    <WhatsappIcon />
                                </Link>
                            </Button>
                        </div>
                     </CardContent>
                </Card>
            </div>
        </section>
    );
}
