
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getChatsByUserId, UserProfile, Chat } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bot, User, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ViewUserChatsDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewUserChatsDialog({ user, isOpen, onClose }: ViewUserChatsDialogProps) {
  const { t } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserChats() {
      if (isOpen && user?.uid) { // Ensure user and user.uid are available
        setLoading(true);
        const userChats = await getChatsByUserId(user.uid);
        setChats(userChats);
        setLoading(false);
      }
    }
    fetchUserChats();
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('chatHistoryFor', { name: user.displayName || user.email })}</DialogTitle>
          <DialogDescription>{t('viewUserChatsDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 my-4">
            <div className="pr-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : chats.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {chats.map(chat => (
                            <AccordionItem key={chat.id} value={chat.id}>
                                <AccordionTrigger>
                                    <div className='flex items-center gap-4'>
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <div className='text-left'>
                                            <p className="font-semibold">
                                                {t('conversationOnDate', { date: chat.createdAt ? format(chat.createdAt.toDate(), 'PPP p') : 'No date' })}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                        <div className="space-y-4">
                                            {chat.messages.map((message, index) => (
                                                <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                                                    {message.role === 'user' && (
                                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                                            <AvatarImage src={user?.photoURL || undefined} />
                                                            <AvatarFallback>
                                                              <User className="h-4 w-4" />
                                                            </AvatarFallback>
                                                         </Avatar>
                                                    )}
                                                    <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", message.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    </div>
                                                    {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground py-8">{t('noConversationsFound')}</p>
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
