
'use client';

import { useEffect, useState } from 'react';
import { getCeremonies, Ceremony } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import EditCeremonyDialog from '@/components/home/EditCeremonyDialog';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function AllCeremoniesPage() {
    const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchCeremonies = async () => {
            setLoading(true);
            try {
                const data = await getCeremonies(); // Get all ceremonies
                setCeremonies(data);
            } catch (error) {
                console.error("Failed to fetch ceremonies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCeremonies();
    }, []);

    const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
        setCeremonies(prev => prev.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
        setEditingCeremony(null);
    };

    const handleCeremonyDelete = (id: string) => {
        setCeremonies(prev => prev.filter(c => c.id !== id));
        setEditingCeremony(null);
    };
    
    const handleCeremonyAdd = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony]);
    }
    
    const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony]);
    }

    const isAdmin = user && user.email === ADMIN_EMAIL;

    const getStatusVariant = (status?: Ceremony['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'finished': return 'secondary';
            case 'inactive': return 'outline';
            default: return 'outline';
        }
    };

    if (loading) {
        return (
            <div className="container py-12 md:py-16 space-y-8">
                <Skeleton className="h-10 w-1/3 mx-auto" />
                <Skeleton className="h-8 w-2/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-96 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('allCeremoniesTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('allCeremoniesSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {ceremonies.map(ceremony => {
                    const status = ceremony.status || 'inactive';
                    return (
                        <Card key={ceremony.id} className="relative group overflow-hidden rounded-lg shadow-lg bg-card/50 flex flex-col">
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full z-20 bg-black/50 hover:bg-black/80 text-white"
                                    onClick={() => setEditingCeremony(ceremony)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            <CardHeader className="p-0">
                                <div className="relative aspect-video">
                                    <VideoPlayer 
                                        videoUrl={ceremony.mediaUrl}
                                        mediaType={ceremony.mediaType}
                                        title={ceremony.title}
                                        isActivated={true} // Simplified for list view
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col flex-1">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-headline mb-2 pr-4">{ceremony.title}</CardTitle>
                                    <Badge variant={getStatusVariant(status)} className="capitalize flex-shrink-0">
                                        {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                                    </Badge>
                                </div>
                                 <div className="font-mono text-xs text-muted-foreground mt-2 space-y-1">
                                    {ceremony.date && (
                                    <p className="flex items-center gap-1.5">
                                        <CalendarIcon className='w-3 h-3'/> {ceremony.date}
                                    </p>
                                    )}
                                </div>
                                <CardDescription className="mt-2 text-sm text-foreground/80 line-clamp-3 flex-grow">
                                    {ceremony.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            {editingCeremony && (
                 <EditCeremonyDialog
                    ceremony={editingCeremony}
                    isOpen={!!editingCeremony}
                    onClose={() => setEditingCeremony(null)}
                    onUpdate={handleCeremonyUpdate}
                    onAdd={handleCeremonyAdd}
                    onDelete={handleCeremonyDelete}
                    onDuplicate={handleCeremonyDuplicate}
                 />
            )}
        </div>
    );
}
