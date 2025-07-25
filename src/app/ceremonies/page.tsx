'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import EditCeremonyDialog from '@/components/home/EditCeremonyDialog';
import { EditableTitle } from '@/components/home/EditableTitle';

export default function AllCeremoniesPage() {
    const { t } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setIsAdmin(currentUser?.email === 'wilson2403@gmail.com');
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <EditableTitle
                    tag="h1"
                    id="allCeremoniesPageTitle"
                    initialValue={t('allCeremoniesPageTitle')}
                    className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                <div className="mt-2 text-lg text-foreground/80 font-body">
                    <EditableTitle
                        tag="span"
                        id="allCeremoniesPageSubtitle"
                        initialValue={t('allCeremoniesPageSubtitle')}
                    />
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsAdding(true)} className="mt-4">
                        <PlusCircle className="mr-2" />
                        <EditableTitle
                            tag="span"
                            id="addCeremony"
                            initialValue={t('addCeremony')}
                        />
                    </Button>
                )}
            </div>
            
            {/* The rest of the component that lists ceremonies is omitted for brevity */}

            {isAdding && (
                <EditCeremonyDialog
                    ceremony={null}
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    onUpdate={() => {}}
                    onAdd={() => {}}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                />
            )}
        </div>
    );
}
