
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, AlertTriangle, FileJson, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { exportAllData, importAllData, BackupData } from '@/lib/firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function BackupPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [lastBackup, setLastBackup] = useState<BackupData | null>(null);

    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await exportAllData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `el-arte-de-sanar-backup-${new Date().toISOString()}.json`;
            link.click();
            toast({ title: t('exportSuccessTitle') });
        } catch (error) {
            console.error("Failed to export data:", error);
            toast({ title: t('exportErrorTitle'), variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileToImport(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!fileToImport) return;

        setIsImporting(true);
        try {
            const fileText = await fileToImport.text();
            const dataToImport = JSON.parse(fileText) as BackupData;
            
            // This is the critical step: create a backup before importing.
            const automaticBackup = await exportAllData();
            setLastBackup(automaticBackup);

            await importAllData(dataToImport);
            toast({ title: t('importSuccessTitle'), description: t('importSuccessDescription') });
        } catch (error) {
            console.error("Failed to import data:", error);
            toast({ title: t('importErrorTitle'), description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsImporting(false);
            setFileToImport(null);
        }
    };

    const handleRollback = async () => {
        if (!lastBackup) return;

        setIsImporting(true);
        try {
            await importAllData(lastBackup);
            toast({ title: t('rollbackSuccessTitle'), description: t('rollbackSuccessDescription') });
            setLastBackup(null); // Clear rollback data after use
        } catch (error) {
            console.error("Failed to rollback data:", error);
            toast({ title: t('rollbackErrorTitle'), description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsImporting(false);
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
                    {t('backupTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('backupSubtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Export Card */}
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className='flex items-center gap-3'><Download /> {t('exportDataTitle')}</CardTitle>
                        <CardDescription>{t('exportDataDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? t('exportingButtonText') : t('exportButton')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Import Card */}
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className='flex items-center gap-3'><Upload /> {t('importDataTitle')}</CardTitle>
                        <CardDescription>{t('importDataDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                           <label htmlFor="import-file" className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
                                <FileJson />
                                {fileToImport ? fileToImport.name : t('selectFileButton')}
                            </label>
                            <input id="import-file" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={isImporting || !fileToImport}>
                                    {isImporting ? t('importing') : t('importButton')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className='flex items-center gap-2'><AlertTriangle className="text-destructive"/>{t('importWarningTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('importWarningDescription')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleImport}>{t('continue')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
             {lastBackup && (
                <Card className="bg-yellow-900/20 border-yellow-500/50">
                    <CardHeader>
                        <CardTitle className='flex items-center gap-3 text-yellow-400'><History /> {t('rollbackCardTitle')}</CardTitle>
                        <CardDescription className='text-yellow-400/80'>{t('rollbackCardDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    {isImporting ? t('rollingBack') : t('rollbackButton')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className='flex items-center gap-2'><AlertTriangle />{t('rollbackWarningTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('rollbackWarningDescription')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRollback}>{t('continue')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
