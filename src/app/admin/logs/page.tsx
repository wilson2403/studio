
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('logTimestamp')}</TableHead>
                                <TableHead>{t('logMessage')}</TableHead>
                                <TableHead>{t('logStatus')}</TableHead>
                                <TableHead>{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(log.timestamp.toDate(), 'PPP p')}</TableCell>
                                    <TableCell className="max-w-sm truncate">{log.message}</TableCell>
                                    <TableCell>
                                        {log.status === 'fixed' ? (
                                            <span className='flex items-center gap-2 text-green-500'><CheckCircle className="h-4 w-4" /> {t('logStatusFixed')}</span>
                                        ) : (
                                            <span className='flex items-center gap-2 text-red-500'><XCircle className="h-4 w-4" /> {t('logStatusNew')}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className='flex gap-2'>
                                        <Button variant="outline" size="sm" onClick={() => setViewingLog(log)}>
                                            <Eye className="mr-2 h-4 w-4" /> {t('viewDetails')}
                                        </Button>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {viewingLog && (
                 <AlertDialog open={!!viewingLog} onOpenChange={(isOpen) => !isOpen && setViewingLog(null)}>
                    <AlertDialogContent className="max-w-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('logDetails')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('logDetailsDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <ScrollArea className="max-h-[60vh] p-1 pr-4 mt-4">
                            <div className='bg-muted/50 p-4 rounded-md font-mono text-sm space-y-4'>
                                <div>
                                    <h4 className='font-bold mb-1'>{t('logTimestamp')}:</h4>
                                    <p>{format(viewingLog.timestamp.toDate(), 'PPP p')}</p>
                                </div>
                                <div>
                                    <h4 className='font-bold mb-1'>{t('logMessage')}:</h4>
                                    <p className='whitespace-pre-wrap'>{viewingLog.message}</p>
                                </div>
                                {viewingLog.stack && (
                                     <div>
                                        <h4 className='font-bold mb-1'>{t('logStack')}:</h4>
                                        <p className='whitespace-pre-wrap'>{viewingLog.stack}</p>
                                    </div>
                                )}
                                {viewingLog.context && (
                                     <div>
                                        <h4 className='font-bold mb-1'>{t('logContext')}:</h4>
                                        <p className='whitespace-pre-wrap'>{JSON.stringify(viewingLog.context, null, 2)}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <AlertDialogFooter>
                             <Button onClick={() => alert(t('featureComingSoon'))}>{t('fixWithAI')}</Button>
                             <AlertDialogCancel>{t('close')}</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

        </div>
    );
}
