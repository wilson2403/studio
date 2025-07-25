
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ceremony, Plan } from '@/types';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Check, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { getUserProfile, incrementCeremonyWhatsappClick } from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { ScrollArea } from '../ui/scroll-area';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

interface CeremonyDetailsDialogProps {
  ceremony: Ceremony | null;
  isOpen: boolean;
  onClose: () => void;
}

const USD_EXCHANGE_RATE = 500;

export default function CeremonyDetailsDialog({ ceremony, isOpen, onClose }: CeremonyDetailsDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            const profile = await getUserProfile(currentUser.uid);
            setIsAdmin(!!profile?.isAdmin || currentUser.email === ADMIN_EMAIL);
        } else {
            setIsAdmin(false);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Reset selected plan when dialog opens for a new ceremony
    if (isOpen) {
      setSelectedPlan(null);
    }
  }, [isOpen]);

  if (!ceremony) return null;

  const isEnglish = i18n.language === 'en';
  const hasPlans = ceremony.priceType === 'from' && ceremony.plans && ceremony.plans.length > 0;

  const formatPrice = (price: number, priceUntil?: number) => {
    if (isEnglish) {
      const priceInUSD = Math.round(price / USD_EXCHANGE_RATE);
      if (priceUntil && priceUntil > price) {
        const priceUntilInUSD = Math.round(priceUntil / USD_EXCHANGE_RATE);
        return `$${priceInUSD} - $${priceUntilInUSD} USD`;
      }
      return `$${priceInUSD} USD`;
    }
    if (priceUntil && priceUntil > price) {
        return `${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(price)} - ${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(priceUntil)}`;
    }
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(price);
  };

  const getBasePriceText = () => {
    const prefix = ceremony.priceType === 'from' ? (isEnglish ? 'From ' : 'Desde ') : '';
    return `${prefix}${formatPrice(ceremony.price)}`;
  };
  
  const getWhatsappLink = () => {
    const originalLink = ceremony.link;

    if (!selectedPlan || !hasPlans) {
        return originalLink;
    }

    let phone = '';
    const phoneRegex = /(?:wa\.me\/|phone=)(\d+)/;
    const match = originalLink.match(phoneRegex);

    if (match && match[1]) {
        phone = match[1];
    }

    if (!phone) {
        console.warn("Could not extract phone number from WhatsApp link:", originalLink);
        return originalLink; // Fallback to the original link if no phone number is found
    }
    
    const textParam = new URLSearchParams(originalLink.split('?')[1]).get('text');
    const baseText = textParam ? `${textParam} - Plan: ${selectedPlan.name}` : `Hola, me interesa la ceremonia ${ceremony.title} con el plan: ${selectedPlan.name}`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(baseText)}`;
  }

  const handleWhatsappClick = () => {
    if (ceremony && !isAdmin) {
        incrementCeremonyWhatsappClick(ceremony.id);
    }
  }
  
  const isDisabled = hasPlans && !selectedPlan;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-0 pr-12">
                <DialogTitle className="text-2xl font-headline">{ceremony.title}</DialogTitle>
                <div className="font-mono text-xs text-muted-foreground pt-1 space-y-1">
                    {ceremony.date && (
                    <p className="flex items-center gap-1.5">
                        <CalendarIcon className='w-3 h-3'/> {ceremony.date}
                    </p>
                    )}
                    {ceremony.horario && (
                    <p className="flex items-center gap-1.5">
                        <Clock className='w-3 h-3'/> {ceremony.horario}
                    </p>
                    )}
                </div>
                <DialogDescription className='pt-2'>
                    {ceremony.description}
                </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 py-4">
                    {!hasPlans ? (
                        <div className="text-center">
                            <span className="text-4xl font-bold text-foreground">
                                {getBasePriceText()}
                            </span>
                            <p className="text-sm text-muted-foreground">
                                {ceremony.contributionText || t('fullPlanUpTo')}
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            <h4 className='font-bold text-center'>{t('selectAPlan')}</h4>
                            <RadioGroup onValueChange={(value) => setSelectedPlan(JSON.parse(value))} className='space-y-2'>
                                {ceremony.plans?.map((plan, i) => (
                                    <Label key={i} htmlFor={`plan-${i}`} className='flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary'>
                                        <div>
                                            <p className="font-semibold">{plan.name}</p>
                                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                                        </div>
                                        <div className='flex items-center gap-4'>
                                            <span className="font-bold text-lg">{formatPrice(plan.price, plan.priceUntil)}</span>
                                            <RadioGroupItem value={JSON.stringify(plan)} id={`plan-${i}`} />
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                            {ceremony.contributionText && (
                                <p className="text-sm text-center text-muted-foreground">
                                    {ceremony.contributionText}
                                </p>
                            )}
                        </div>
                    )}
                    <ul className="space-y-3 pt-4">
                        <li className="flex items-center gap-3 font-bold">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{t('includes')}</span>
                        </li>
                        {ceremony.features?.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 ml-4">
                            <Check className="h-5 w-5 text-primary/70" />
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                        ))}
                    </ul>
                </div>
            </ScrollArea>
            
            {ceremony.status === 'active' && (
            <DialogFooter className="w-full p-6 pt-0 mt-auto">
                <Button asChild className={cn("w-full", isDisabled && 'opacity-50 pointer-events-none')}>
                <a href={isDisabled ? '#' : getWhatsappLink()} target="_blank" rel="noopener noreferrer" onClick={handleWhatsappClick}>
                    {t('reserveWhatsapp')}
                </a>
                </Button>
            </DialogFooter>
            )}
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
