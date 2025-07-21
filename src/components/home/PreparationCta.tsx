
'use client';

import { useTranslation } from "react-i18next";
import { EditableTitle } from "./EditableTitle";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PreparationCta() {
    const { t } = useTranslation();

    return (
        <section className="bg-primary/5 border-y border-primary/20 py-8 md:py-16">
            <div className="container text-center flex flex-col items-center pl-20">
                <EditableTitle 
                    tag="h2"
                    id="preparationCtaTitle"
                    initialValue={t('preparationCtaTitle')}
                    className="text-3xl md:text-4xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                 <EditableTitle 
                    tag="p"
                    id="preparationCtaDescription"
                    initialValue={t('preparationCtaDescription')}
                    className="mt-4 max-w-2xl text-lg text-foreground/80 font-body"
                />
                <Button asChild className="mt-8">
                    <Link href="/preparation">
                        {t('preparationCtaButton')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </section>
    )
}
