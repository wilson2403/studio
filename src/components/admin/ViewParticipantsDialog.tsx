
'use client';

import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ceremony, UserProfile } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { EditableTitle } from '@/components/home/EditableTitle';
import { useAuth } from '@/hooks/useAuth';

interface ViewParticipantsDialogProps {
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewParticipantsDialog({ ceremony, isOpen, onClose }: ViewParticipantsDialogProps) {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const participants = ceremony.assignedUsers || [];
  
  const isUserAssigned = userProfile?.assignedCeremonies?.some(ac => (typeof ac === 'string' ? ac : ac.ceremonyId) === ceremony.id);
  const isUserAdmin = userProfile?.role === 'admin' || userProfile?.role === 'organizer';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <EditableTitle
              tag="h2"
              id="participantsForTitle"
              initialValue={t('participantsFor', { ceremonyTitle: ceremony.title })}
              className="text-xl font-semibold"
            />
          </DialogTitle>
          <DialogDescription>
            <EditableTitle
              tag="span"
              id="participantCountText"
              initialValue={t('participantCount', { count: participants.length })}
              className="text-sm text-muted-foreground"
            />
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 my-4">
          <div className="space-y-4 pr-4">
            {participants.length > 0 ? (
                participants.map(user => (
                    <div key={user.uid} className="flex items-center gap-4 p-2 border rounded-lg">
                        <Avatar>
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{user.displayName || 'Anonymous'}</p>
                            
                            {(isUserAdmin || isUserAssigned) && (
                              <>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </p>
                                {user.phone && (
                                    <Link href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} target='_blank' className="text-xs text-muted-foreground flex items-center gap-1.5 hover:underline">
                                        <Phone className="h-3 w-3" />
                                        {user.phone}
                                    </Link>
                                )}
                              </>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-8">{t('noParticipants')}</p>
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
