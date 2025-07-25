
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCeremonyById, UserProfile, Ceremony, CeremonyInvitationMessage } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { WhatsappIcon } from '../icons/WhatsappIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface InviteToCeremonyDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  invitationTemplates: CeremonyInvitationMessage[];
}

export default function InviteToCeremonyDialog({ user, isOpen, onClose, invitationTemplates }: InviteToCeremonyDialogProps) {
  const { t, i18n } = useTranslation();
  const [assignedCeremonies, setAssignedCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyInvitationMessage | null>(null);


  useEffect(() => {
    async function fetchAssignedCeremonies() {
      if (isOpen) {
        setLoading(true);
        if (user.assignedCeremonies?.length) {
          const ceremonyPromises = user.assignedCeremonies.map(id => getCeremonyById(id));
          const results = await Promise.all(ceremonyPromises);
          const activeCeremonies = results.filter(c => c && c.status === 'active') as Ceremony[];
          setAssignedCeremonies(activeCeremonies);
        } else {
          setAssignedCeremonies([]);
        }
        
        if (invitationTemplates.length > 0) {
            setSelectedTemplate(invitationTemplates[0]);
        }
        setLoading(false);
      } else {
        // Reset state on close
        setSelectedCeremony(null);
        setSelectedTemplate(null);
      }
    }
    fetchAssignedCeremonies();
  }, [isOpen, user, invitationTemplates]);
  
  const handleSendInvite = () => {
    if (!user.phone || !selectedCeremony || !selectedTemplate) return;

    const lang = i18n.language as 'es' | 'en';
    let message = selectedTemplate[lang] || selectedTemplate.es;

    message = message.replace(/{{userName}}/g, user.displayName || 'participante');
    message = message.replace(/{{ceremonyTitle}}/g, selectedCeremony.title || '');
    message = message.replace(/{{ceremonyDate}}/g, selectedCeremony.date || '');
    message = message.replace(/{{ceremonyHorario}}/g, selectedCeremony.horario || '');
    message = message.replace(/{{ceremonyLink}}/g, `${window.location.origin}/ceremonias/${selectedCeremony.id}`);
    message = message.replace(/{{locationLink}}/g, selectedCeremony.locationLink || '');
    
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
        <div className="space-y-4 py-4">
           {loading ? (
              <Skeleton className="h-10 w-full" />
           ) : assignedCeremonies.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ceremony-select">{t('selectCeremony')}</Label>
                 <Select onValueChange={(value) => setSelectedCeremony(JSON.parse(value))}>
                    <SelectTrigger id="ceremony-select">
                        <SelectValue placeholder={t('selectCeremonyPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {assignedCeremonies.map(ceremony => (
                            <SelectItem key={ceremony.id} value={JSON.stringify(ceremony)}>
                                {ceremony.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-select">{t('selectTemplate')}</Label>
                <Select
                    value={selectedTemplate ? JSON.stringify(selectedTemplate) : ''}
                    onValueChange={(value) => setSelectedTemplate(JSON.parse(value))}
                >
                    <SelectTrigger id="template-select">
                        <SelectValue placeholder={t('selectTemplatePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {invitationTemplates.map(template => (
                            <SelectItem key={template.id} value={JSON.stringify(template)}>
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </>
           ) : (
             <p className="text-center text-muted-foreground py-8">{t('noActiveAssignedCeremonies')}</p>
           )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleSendInvite} disabled={!selectedCeremony || !selectedTemplate}>
              <WhatsappIcon className="mr-2 h-4 w-4"/>
              {t('sendInvitation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    