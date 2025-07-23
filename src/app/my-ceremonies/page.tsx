
'use client';

import { useEffect, useState } from 'react';
import { getCeremonies, Ceremony, getUserProfile, UserProfile } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import VideoPopupDialog from '@/components/home/VideoPopupDialog';
import CeremonyDetailsDialog from '@/components/home/CeremonyDetailsDialog';
import { EditableProvider } from '@/components/home/EditableProvider';
import { Badge } from '@/components/ui/badge';
import { EditableTitle } from '@/components/home/EditableTitle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Expand, ExternalLink, Users } from 'lucide-react';

export default function MyCeremoniesPage() {
    const [assignedCeremonies, setAssignedCeremonies] = useState<Ceremony[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
    const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
                if (profile?.assignedCeremonies && profile.assignedCeremonies.length > 0) {
                    const allCeremonies = await getCeremonies();
                    const userCeremonies = allCeremonies.filter(c => profile.assignedCeremonies?.includes(c.id));
                    setAssignedCeremonies(userCeremonies);
                }
            } else {
                router.push('/login?redirect=/my-ceremonies');
            }
            setPageLoading(false);
        });
        return () => unsubscribe();
    }, [router]);
    
    const handleExpandVideo = (e: React.MouseEvent, ceremony: Ceremony) => {
        e.stopPropagation();
        setActiveVideo(null);
        setExpandedVideo(ceremony);
    };

    if (pageLoading) {
        return (
            <div className="container py-12 md:py-16 space-y-8">
                <Skeleton className="h-10 w-1/3 mx-auto" />
                <Skeleton className="h-8 w-2/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-96 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <EditableProvider>
            <div className="container py-12 md:py-16 space-y-12">
                <div className="text-center">
                    <EditableTitle
                        tag="h1"
                        id="myCeremoniesTitle"
                        initialValue={t('myCeremoniesTitle')}
                        className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                    />
                     <EditableTitle
                        tag="p"
                        id="myCeremoniesSubtitle"
                        initialValue={t('myCeremoniesSubtitle')}
                        className="mt-2 text-lg text-foreground/80 font-body"
                    />
                </div>
                
                {assignedCeremonies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-stretch justify-center">
                        {assignedCeremonies.map((ceremony) => {
                            const statusText = `status${ceremony.status.charAt(0).toUpperCase() + ceremony.status.slice(1)}`;
                            const statusVariant = ceremony.status === 'active' ? 'success' : ceremony.status === 'inactive' ? 'warning' : 'secondary';
                            return (
                                <div key={ceremony.id} className="px-5">
                                    <Card 
                                        onMouseEnter={() => setActiveVideo(ceremony.id)}
                                        onMouseLeave={() => setActiveVideo(null)}
                                        className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50 h-full"
                                    >
                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 items-start">
                                            <Badge variant={statusVariant} className="capitalize">
                                                {t(statusText)}
                                            </Badge>
                                            <div className='flex gap-2'>
                                                {ceremony.mediaUrl && (
                                                    <a href={ceremony.mediaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    </a>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => handleExpandVideo(e, ceremony)}>
                                                    <Expand className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="aspect-[4/5] overflow-hidden rounded-t-2xl relative group/video">
                                            <VideoPlayer 
                                                ceremonyId={ceremony.id}
                                                videoUrl={ceremony.mediaUrl} 
                                                mediaType={ceremony.mediaType}
                                                videoFit={ceremony.videoFit}
                                                title={ceremony.title}
                                                isActivated={activeVideo === ceremony.id && !expandedVideo}
                                                inCarousel={false}
                                            />
                                        </div>
                                        <CardContent className="p-4 bg-primary/10 rounded-b-lg text-center flex flex-col justify-center flex-grow">
                                            <p className="font-mono text-xl font-bold text-white mb-2">
                                                {ceremony.title}
                                            </p>
                                            <Button variant="default" className='w-full' onClick={() => setViewingCeremony(ceremony)}>
                                                {t('viewDetails')}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="w-full max-w-md text-center mx-auto bg-card/50">
                        <CardHeader>
                            <CardTitle>{t('noAssignedCeremoniesTitle')}</CardTitle>
                            <CardDescription>{t('noAssignedCeremoniesDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/ceremonies">{t('exploreCeremonies')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {viewingCeremony && (
                    <CeremonyDetailsDialog
                    ceremony={viewingCeremony}
                    isOpen={!!viewingCeremony}
                    onClose={() => setViewingCeremony(null)}
                    />
                )}

                {expandedVideo && (
                    <VideoPopupDialog
                        isOpen={!!expandedVideo}
                        onClose={() => setExpandedVideo(null)}
                        videoUrl={expandedVideo.mediaUrl}
                        mediaType={expandedVideo.mediaType}
                        title={expandedVideo.title}
                    />
                )}
            </div>
        </EditableProvider>
    );
}

