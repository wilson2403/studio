
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ceremony, Plan } from '@/types';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Check, Clock } from 'lucide-react';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';

interface CeremonyDetailsDialogProps {
  ceremony: Ceremony | null;
  isOpen: boolean;
  onClose: () => void;
}

const USD_EXCHANGE_RATE = 500;

export default function CeremonyDetailsDialog({ ceremony, isOpen, onClose }: CeremonyDetailsDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
      if (!selectedPlan || !hasPlans) {
          return ceremony.link;
      }
      
      const textParam = new URLSearchParams(ceremony.link.split('?')[1]).get('text');
      const baseText = textParam ? `${textParam} - Plan: ${selectedPlan.name}` : `Hola, me interesa la ceremonia ${ceremony.title} con el plan: ${selectedPlan.name}`;
      
      return `https://wa.me/?text=${encodeURIComponent(baseText)}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setSelectedPlan(null);
        }
        onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
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
        <ScrollArea className="max-h-[60vh] pr-6">
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
        <DialogFooter>
          <Button asChild className="w-full" disabled={hasPlans && !selectedPlan}>
            <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer">
              {t('reserveWhatsapp')}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
