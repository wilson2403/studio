
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCeremonies, updateUserAssignedCeremonies, UserProfile, Ceremony, CeremonyInvitationMessage } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { SendHorizonal, Share2 } from 'lucide-react';
import InviteToCeremonyDialog from './InviteToCeremonyDialog';

interface AssignCeremonyDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
  invitationTemplates: CeremonyInvitationMessage[];
}

export default function AssignCeremonyDialog({ user, isOpen, onClose, onUpdate, invitationTemplates }: AssignCeremonyDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCeremonies, setSelectedCeremonies] = useState<(string | { ceremonyId: string; planId: string })[]>([]);
  const [invitingToCeremony, setInvitingToCeremony] = useState<Ceremony | null>(null);

  useEffect(() => {
    async function fetchAllCeremonies() {
      if (isOpen) {
        setLoading(true);
        const allCeremonies = await getCeremonies(); // Fetch all ceremonies regardless of status
        setCeremonies(allCeremonies);
        setSelectedCeremonies(user.assignedCeremonies || []);
        setLoading(false);
      }
    }
    fetchAllCeremonies();
  }, [isOpen, user]);
  
  const handleCheckboxChange = (ceremonyId: string, checked: boolean) => {
    setSelectedCeremonies(prev => 
      checked ? [...prev, ceremonyId] : prev.filter(id => (typeof id === 'string' ? id : id.ceremonyId) !== ceremonyId)
    );
  };

  const handleSaveChanges = async () => {
    try {
      await updateUserAssignedCeremonies(user.uid, selectedCeremonies);
      onUpdate({ ...user, assignedCeremonies: selectedCeremonies });
      toast({ title: t('assignmentsUpdatedSuccess') });
      onClose();
    } catch (error: any) {
      toast({ title: t('errorUpdatingAssignments'), description: error.message, variant: 'destructive' });
    }
  };
  
  const handleInviteClick = (e: React.MouseEvent, ceremony: Ceremony) => {
    e.stopPropagation(); // Prevent the label from toggling the checkbox
    setInvitingToCeremony(ceremony);
  }
  
  const handleShareClick = (e: React.MouseEvent, ceremony: Ceremony) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/artesanar/${ceremony.id}`;
    const message = t('shareCeremonyMemoryAdminText', { user: user.displayName, ceremony: ceremony.title, link: shareUrl });
    const whatsappUrl = `https://wa.me/${user.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignCeremonyTo', { name: user.displayName || user.email })}</DialogTitle>
            <DialogDescription>{t('assignCeremonyDescriptionAdmin')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 my-4">
            <div className="space-y-4 pr-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : ceremonies.length > 0 ? (
                ceremonies.map(ceremony => {
                  const isAssigned = selectedCeremonies.some(id => (typeof id === 'string' ? id : id.ceremonyId) === ceremony.id);
                  const isInviteable = !!user.phone;
                  return (
                    <div key={ceremony.id} className="flex items-center space-x-3 rounded-md border p-3">
                      <Checkbox
                        id={`ceremony-${ceremony.id}`}
                        checked={isAssigned}
                        onCheckedChange={(checked) => handleCheckboxChange(ceremony.id, !!checked)}
                      />
                      <Label htmlFor={`ceremony-${ceremony.id}`} className="flex flex-col gap-1 w-full cursor-pointer">
                        <span className="font-semibold">{ceremony.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">({t(`status${ceremony.status.charAt(0).toUpperCase() + ceremony.status.slice(1)}`)})</span>
                        {ceremony.date && <span className="text-xs text-muted-foreground">{ceremony.date}</span>}
                      </Label>
                      <div className='flex gap-2'>
                        {isAssigned && isInviteable && ceremony.status === 'active' && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => handleInviteClick(e, ceremony)}>
                            <SendHorizonal className="h-4 w-4" />
                            <span className="sr-only">{t('inviteToCeremonyButton')}</span>
                          </Button>
                        )}
                        {isAssigned && isInviteable && ceremony.status !== 'active' && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => handleShareClick(e, ceremony)}>
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">{t('shareCeremonyMemoryButton')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('noCeremoniesFound')}</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={loading}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invitingToCeremony && (
        <InviteToCeremonyDialog
          user={user}
          ceremony={invitingToCeremony}
          isOpen={!!invitingToCeremony}
          onClose={() => setInvitingToCeremony(null)}
          invitationTemplates={invitationTemplates}
        />
      )}
    </>
  );
}

