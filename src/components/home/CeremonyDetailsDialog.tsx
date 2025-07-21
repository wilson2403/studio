
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
import { Ceremony } from '@/types';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface CeremonyDetailsDialogProps {
  ceremony: Ceremony | null;
  isOpen: boolean;
  onClose: () => void;
}

const USD_EXCHANGE_RATE = 500;

export default function CeremonyDetailsDialog({ ceremony, isOpen, onClose }: CeremonyDetailsDialogProps) {
  const { t, i18n } = useTranslation();

  if (!ceremony) return null;

  const formatPrice = () => {
    const { price, priceType } = ceremony;
    const isEnglish = i18n.language === 'en';
    
    let formattedPrice: string;

    if (isEnglish) {
      const priceInUSD = Math.round(price / USD_EXCHANGE_RATE);
      formattedPrice = `$${priceInUSD} USD`;
    } else {
      formattedPrice = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(price);
    }
    
    const prefix = priceType === 'from' ? (isEnglish ? 'From ' : 'Desde ') : '';

    return `${prefix}${formattedPrice}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{ceremony.title}</DialogTitle>
          <DialogDescription>
            {ceremony.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="text-center">
                <span className="text-4xl font-bold text-foreground">
                    {formatPrice()}
                </span>
                <p className="text-sm text-muted-foreground">
                    {t('fullPlanUpTo')}
                </p>
            </div>
            <ul className="space-y-3">
                 <li className="flex items-center gap-3 font-bold">
                  <Check className="h-5 w-5 text-primary" />
                  <span>{t('includes')}</span>
                </li>
                {ceremony.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 ml-4">
                    <Check className="h-5 w-5 text-primary/70" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
            </ul>
        </div>
        <DialogFooter>
          <Button asChild className="w-full">
            <Link href={ceremony.link} target="_blank" rel="noopener noreferrer">
              {t('bookSpot')}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
