
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCeremonyById, UserProfile, Ceremony } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { WhatsappIcon } from '../icons/WhatsappIcon';

interface InviteToCeremonyDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteToCeremonyDialog({ user, isOpen, onClose }: InviteToCeremonyDialogProps) {
  const { t } = useTranslation();
  const [assignedCeremonies, setAssignedCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedCeremonies() {
      if (isOpen && user.assignedCeremonies?.length) {
        setLoading(true);
        const ceremonyPromises = user.assignedCeremonies.map(id => getCeremonyById(id));
        const results = await Promise.all(ceremonyPromises);
        setAssignedCeremonies(results.filter(Boolean) as Ceremony[]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
    fetchAssignedCeremonies();
  }, [isOpen, user]);

  const handleSendInvite = (ceremony: Ceremony) => {
    if (!user.phone) return;

    const ceremonyLink = `${window.location.origin}/ceremonias/${ceremony.id}`;
    const message = t('ceremonyInvitationMessage', {
      name: user.displayName,
      ceremonyTitle: ceremony.title,
      ceremonyDate: ceremony.date,
      link: ceremonyLink,
    });
    
    const phoneNumber = user.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inviteToCeremonyTitle')}</DialogTitle>
          <DialogDescription>{t('inviteToCeremonyDescription', { name: user.displayName || user.email })}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 my-4">
          <div className="space-y-2 pr-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : assignedCeremonies.length > 0 ? (
              assignedCeremonies.map(ceremony => (
                <div key={ceremony.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="font-semibold">{ceremony.title}</p>
                    <p className="text-sm text-muted-foreground">{ceremony.date}</p>
                  </div>
                  <Button size="sm" onClick={() => handleSendInvite(ceremony)}>
                    <WhatsappIcon className="mr-2 h-4 w-4" />
                    {t('invite')}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('noAssignedCeremonies')}</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
