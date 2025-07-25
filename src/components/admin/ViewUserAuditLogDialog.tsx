
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuditLogsForUser, UserProfile, AuditLog } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ViewUserAuditLogDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedLogs {
    [date: string]: AuditLog[];
}

export default function ViewUserAuditLogDialog({ user, isOpen, onClose }: ViewUserAuditLogDialogProps) {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<GroupedLogs>({});
  const [loading, setLoading] = useState(true);

  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    async function fetchLogs() {
      if (isOpen) {
        setLoading(true);
        const userLogs = await getAuditLogsForUser(user.uid);
        
        const grouped = userLogs.reduce((acc, log) => {
            const date = format(log.timestamp.toDate(), 'PPP', { locale });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {} as GroupedLogs);

        setLogs(grouped);
        setLoading(false);
      }
    }
    fetchLogs();
  }, [isOpen, user, locale]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('auditLogFor', { name: user.displayName || user.email })}</DialogTitle>
          <DialogDescription>{t('viewUserAuditLogDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 my-4">
            <div className="pr-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : Object.keys(logs).length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {Object.entries(logs).map(([date, dateLogs]) => (
                            <AccordionItem key={date} value={date} className="border rounded-lg bg-muted/20 px-4">
                                <AccordionTrigger>
                                    <p className="font-semibold">{date} ({t('logCount', { count: dateLogs.length })})</p>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pt-2">
                                    {dateLogs.map(log => (
                                        <div key={log.id} className="text-sm p-3 rounded-md bg-background/50 border">
                                            <p className="font-semibold">
                                                <span className="text-primary">{format(log.timestamp.toDate(), 'p', { locale })}:</span> {t(`auditAction_${log.action}`, { defaultValue: log.action })}
                                            </p>
                                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                                {log.page && <p>{t('onPage')}: <code className="bg-muted px-1 py-0.5 rounded">{log.page}</code></p>}
                                                {log.targetType && <p>{t('targetType')}: {log.targetType}</p>}
                                                {log.targetId && <p>{t('targetId')}: {log.targetId}</p>}
                                                {log.changes && (
                                                    <div>
                                                        <p>{t('changes')}:</p>
                                                        <pre className="whitespace-pre-wrap bg-muted p-2 rounded-md mt-1 text-xs">{JSON.stringify(log.changes, null, 2)}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground py-8">{t('noLogsFound')}</p>
                )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
