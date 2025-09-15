
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { migrateContent } from '@/ai/flows/migration-flow';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ADMIN_EMAILS = ['wilson2403@gmail.com', 'wilson2403@hotmail.com'];

type MigrationStatus = 'idle' | 'running' | 'success' | 'error';

export default function AdminMigrationPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('idle');
    const [migrationResult, setMigrationResult] = useState<{ message: string, processedKeys: number, errors: string[] } | null>(null);

    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleMigration = async () => {
        setMigrationStatus('running');
        setMigrationResult(null);
        try {
            const result = await migrateContent();
            setMigrationResult({
                message: result.message,
                processedKeys: result.processedKeys,
                errors: result.errors,
            });
            if (result.success) {
                setMigrationStatus('success');
                toast({ title: t('migrationSuccessTitle'), description: result.message });
            } else {
                setMigrationStatus('error');
                toast({ title: t('migrationErrorTitle'), description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            setMigrationStatus('error');
            setMigrationResult({
                message: error.message || 'An unexpected error occurred.',
                processedKeys: 0,
                errors: [error.message],
            });
            toast({ title: t('migrationErrorTitle'), description: error.message, variant: 'destructive' });
        }
    };


    if (loading) {
        return (
            <div className="container py-12 md:py-16">
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('contentMigrationTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('contentMigrationDescription')}</p>
            </div>

            <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className='flex items-center gap-3'><Database /> {t('migrationToolTitle')}</CardTitle>
                    <CardDescription>{t('migrationToolDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button disabled={migrationStatus === 'running'}>
                                {migrationStatus === 'running' ? (
                                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> {t('migratingButtonText')}</>
                                ) : (
                                    t('startMigrationButton')
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className='flex items-center gap-2'><AlertTriangle className="text-destructive"/>{t('migrationWarningTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('migrationWarningDescription')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMigration}>{t('continue')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {migrationResult && (
                        <div className="mt-6 p-4 border rounded-lg">
                            {migrationStatus === 'success' && (
                                <div className="flex items-center gap-3 text-green-500">
                                    <CheckCircle />
                                    <div>
                                        <h4 className="font-bold">{t('migrationSuccessTitle')}</h4>
                                        <p>{migrationResult.message}</p>
                                    </div>
                                </div>
                            )}
                            {migrationStatus === 'error' && (
                                <div className="text-destructive">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle />
                                        <div>
                                            <h4 className="font-bold">{t('migrationErrorTitle')}</h4>
                                            <p>{migrationResult.message}</p>
                                        </div>
                                    </div>
                                    {migrationResult.errors.length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="font-semibold">{t('errorDetails')}</h5>
                                            <ul className="list-disc list-inside text-xs font-mono space-y-1 mt-2">
                                                {migrationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
