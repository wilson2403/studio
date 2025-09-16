

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserProfile, Ceremony, ShareMemoryMessage } from '@/lib/firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { WhatsappIcon } from '../icons/WhatsappIcon';

interface ShareMemoryDialogProps {
  user: UserProfile;
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
  shareMemoryTemplates: ShareMemoryMessage[];
}

export default function ShareMemoryDialog({ user, ceremony, isOpen, onClose, shareMemoryTemplates }: ShareMemoryDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<ShareMemoryMessage | null>(null);

  useEffect(() => {
    if (isOpen && shareMemoryTemplates.length > 0) {
      setSelectedTemplate(shareMemoryTemplates[0]);
    } else if (!isOpen) {
      setSelectedTemplate(null);
    }
  }, [isOpen, shareMemoryTemplates]);

  const handleSendShare = () => {
    if (!user.phone || !ceremony || !selectedTemplate) return;

    const lang = i18n.language as 'es' | 'en';
    let message = selectedTemplate[lang] || selectedTemplate.es;
    
    const memoryLink = `${window.location.origin}/artesanar/${ceremony.slug || ceremony.id}`;

    message = message.replace(/{{userName}}/g, user.displayName || 'participante');
    message = message.replace(/{{ceremonyTitle}}/g, ceremony.title || '');
    message = message.replace(/{{memoryLink}}/g, memoryLink);
    
    const phoneNumber = user.phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>
                {t('shareMemoryTitle')}
            </DialogTitle>
            <DialogDescription>
                {t('shareMemoryFor', { name: user.displayName || user.email, ceremony: ceremony.title })}
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
           {shareMemoryTemplates.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="template-select">
                    {t('selectTemplate')}
                </Label>
                <Select
                    value={selectedTemplate ? JSON.stringify(selectedTemplate) : ''}
                    onValueChange={(value) => setSelectedTemplate(JSON.parse(value))}
                >
                    <SelectTrigger id="template-select">
                        <SelectValue placeholder={t('selectTemplatePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {shareMemoryTemplates.map(template => (
                            <SelectItem key={template.id} value={JSON.stringify(template)}>
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
           ) : (
             <p className="text-center text-muted-foreground py-8">{t('noShareMemoryTemplatesFound')}</p>
           )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleSendShare} disabled={!selectedTemplate}>
              <WhatsappIcon className="mr-2 h-4 w-4"/>
              {t('sendShare')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
