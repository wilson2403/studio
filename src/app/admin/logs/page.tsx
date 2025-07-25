
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Eye, Terminal, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorLogs, updateErrorLogStatus, deleteErrorLog, deleteAllErrorLogs, ErrorLog } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function AdminLogsPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [viewingLog, setViewingLog] = useState<ErrorLog | null>(null);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const allLogs = await getErrorLogs();
                setLogs(allLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                toast({ title: t('errorFetchLogs'), variant: 'destructive' });
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            await fetchLogs();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t]);

    const handleStatusChange = async (id: string, status: 'new' | 'fixed') => {
        try {
            await updateErrorLogStatus(id, status);
            setLogs(logs.map(log => log.id === id ? { ...log, status } : log));
            toast({ title: t('logStatusUpdated') });
        } catch (error) {
            toast({ title: t('errorUpdatingLog'), variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteErrorLog(id);
            setLogs(logs.filter(log => log.id !== id));
            toast({ title: t('logDeleted') });
        } catch (error) {
            toast({ title: t('errorDeletingLog'), variant: 'destructive' });
        }
    };
    
    const handleDeleteAll = async () => {
        try {
            await deleteAllErrorLogs();
            setLogs([]);
            toast({ title: t('allLogsDeleted') });
        } catch (error) {
            toast({ title: t('errorDeletingAllLogs'), variant: 'destructive' });
        }
    }

    if (loading) {
        return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <div className="space-y-4 w-full">
                    <Skeleton className="h-12 w-1/4 mx-auto" />
                    <Skeleton className="h-8 w-1/2 mx-auto" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('errorLogsTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('errorLogsSubtitle')}</p>
            </div>
            
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('systemLogs')}</CardTitle>
                        <CardDescription>{t('systemLogsDescription')}</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={logs.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t('deleteAll')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('deleteAllLogsConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('deleteAllLogsConfirmDescription')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll}>{t('continue')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {logs.map((log) => (
                            <AccordionItem key={log.id} value={log.id} className="border rounded-lg bg-muted/20 px-4">
                                <AccordionTrigger className="w-full hover:no-underline">
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <div className='flex-1 text-left'>
                                            <p className="font-semibold truncate max-w-xs sm:max-w-md">{log.message}</p>
                                            <p className="text-sm text-muted-foreground">{format(log.timestamp.toDate(), 'PPP p')}</p>
                                        </div>
                                        <Badge variant={log.status === 'fixed' ? 'success' : 'destructive'} className='capitalize'>
                                            {log.status === 'fixed' ? (
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                            ) : (
                                                <XCircle className="mr-2 h-4 w-4" />
                                            )}
                                            {t(`logStatus${log.status.charAt(0).toUpperCase() + log.status.slice(1)}`)}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-4 border-t space-y-4">
                                        <div className='bg-muted/50 p-4 rounded-md font-mono text-sm space-y-4 max-h-96 overflow-y-auto'>
                                            {log.stack && (
                                                <div>
                                                    <h4 className='font-bold mb-1'>{t('logStack')}:</h4>
                                                    <p className='whitespace-pre-wrap'>{log.stack}</p>
                                                </div>
                                            )}
                                            {log.context && Object.keys(log.context).length > 0 && (
                                                <div>
                                                    <h4 className='font-bold mb-1'>{t('logContext')}:</h4>
                                                    <p className='whitespace-pre-wrap'>{JSON.stringify(log.context, null, 2)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex gap-2'>
                                            {log.status === 'new' && (
                                                <Button variant="outline" size="sm" onClick={() => handleStatusChange(log.id, 'fixed')}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> {t('markAsFixed')}
                                                </Button>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('deleteLogConfirmTitle')}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t('deleteLogConfirmDescription')}</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(log.id)}>{t('continue')}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
