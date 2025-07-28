
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserProfile, Ceremony, CeremonyInvitationMessage } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { WhatsappIcon } from '../icons/WhatsappIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { EditableTitle } from '../home/EditableTitle';

interface InviteToCeremonyDialogProps {
  user: UserProfile;
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
  invitationTemplates: CeremonyInvitationMessage[];
}

export default function InviteToCeremonyDialog({ user, ceremony, isOpen, onClose, invitationTemplates }: InviteToCeremonyDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyInvitationMessage | null>(null);

  useEffect(() => {
    if (isOpen && invitationTemplates.length > 0) {
      setSelectedTemplate(invitationTemplates[0]);
    } else if (!isOpen) {
      setSelectedTemplate(null);
    }
  }, [isOpen, invitationTemplates]);

  const handleSendInvite = () => {
    if (!user.phone || !ceremony || !selectedTemplate) return;

    const lang = i18n.language as 'es' | 'en';
    let message = selectedTemplate[lang] || selectedTemplate.es;
    
    const ceremonyLink = `${window.location.origin}/ceremonias/${ceremony.id}`;

    message = message.replace(/{{userName}}/g, user.displayName || 'participante');
    message = message.replace(/{{ceremonyTitle}}/g, ceremony.title || '');
    message = message.replace(/{{ceremonyDate}}/g, ceremony.date || '');
    message = message.replace(/{{ceremonyHorario}}/g, ceremony.horario || '');
    message = message.replace(/{{ceremonyLink}}/g, ceremonyLink);
    message = message.replace(/{{locationLink}}/g, ceremony.locationLink || '');
    
    const phoneNumber = user.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>
                <EditableTitle tag="p" id="inviteToCeremonyTitle" initialValue={t('inviteToCeremonyTitle')} />
            </DialogTitle>
            <DialogDescription>
                <EditableTitle
                    tag="p"
                    id="inviteToCeremonyFor"
                    initialValue={t('inviteToCeremonyFor', { name: user.displayName || user.email, ceremony: ceremony.title })}
                />
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
           {invitationTemplates.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="template-select">
                    <EditableTitle tag="p" id="selectTemplate" initialValue={t('selectTemplate')} />
                </Label>
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
           ) : (
             <p className="text-center text-muted-foreground py-8">{t('noInvitationTemplatesFound')}</p>
           )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleSendInvite} disabled={!selectedTemplate}>
              <WhatsappIcon className="mr-2 h-4 w-4"/>
              {t('sendInvitation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
