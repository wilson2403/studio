
'use client';

import { useEffect, useState }from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { getChatsByUserId, Chat } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Bot, User as UserIcon, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MyChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/chats');
      return;
    }

    const fetchChats = async () => {
      setLoading(true);
      const userChats = await getChatsByUserId(user.uid);
      setChats(userChats);
      setLoading(false);
    };

    fetchChats();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container py-12 md:py-16 space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  if (!user && !authLoading) {
      return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>{t('authRequiredTitle')}</CardTitle>
              <CardDescription>{t('authRequiredForChats')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login?redirect=/chats">{t('signIn')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <div className="container py-12 md:py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          {t('myChatsTitle')}
        </h1>
        <p className="mt-2 text-lg text-foreground/80 font-body">{t('myChatsDescription')}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-2">
        {chats.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {chats.map(chat => (
              <AccordionItem key={chat.id} value={chat.id} className="border rounded-lg bg-card/50 backdrop-blur-sm px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className='flex items-center gap-4'>
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div className='text-left'>
                      <p className="font-semibold">
                        {t('conversationOnDate', { date: chat.createdAt ? format(chat.createdAt.toDate(), 'PPP p', { locale }) : 'No date' })}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-72 w-full rounded-md border p-4 mt-2">
                    <div className="space-y-4">
                      {chat.messages.map((message, index) => (
                        <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                          {message.role === 'user' && (
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={user?.photoURL || undefined} />
                              <AvatarFallback>
                                <UserIcon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm", message.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
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
          <div className="text-center py-16 border border-dashed rounded-lg">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('noConversationsFound')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('noConversationsDescription')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

