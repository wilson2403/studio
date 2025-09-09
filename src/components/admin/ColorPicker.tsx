
'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';

const colors = [
    // Original Greens & Golds
    '125 33% 74%', '150 40% 45%', '47 62% 52%', '40 33% 98%',
    // Sunset Glow (Oranges, Pinks, Purples)
    '25 95% 84%', '15 90% 65%', '330 80% 70%', '270 50% 15%', 
    '35 90% 60%', '350 90% 65%', '250 50% 50%', '30 100% 97%',
    // Oceanic (Blues, Teals)
    '210 90% 85%', '200 80% 60%', '190 70% 45%', '220 40% 12%',
    '220 90% 70%', '180 60% 50%', '230 60% 40%', '210 100% 98%',
    // Rose Quartz (Pinks, Creams)
    '345 80% 90%', '350 75% 75%', '330 60% 55%', '350 20% 18%',
    '355 90% 80%', '0 50% 60%', '340 50% 40%', '30 60% 97%',
    // Earthy Tones (Browns, Terracottas, Olives)
    '30 50% 80%', '25 60% 60%', '80 30% 50%', '30 20% 15%',
    '40 40% 50%', '15 30% 40%', '60 25% 30%', '40 30% 96%',
    // Slate & Stone (Grays, Muted Blues)
    '220 15% 80%', '215 20% 65%', '225 10% 40%', '220 15% 20%',
    '210 15% 50%', '240 5% 30%', '220 10% 25%', '210 20% 98%',
    // Neon Noir (Vibrant Cyberspace)
    '300 100% 70%', '180 100% 50%', '210 100% 55%', '250 30% 7%',
    '280 90% 60%', '160 90% 55%', '320 100% 50%', '0 0% 5%',
    // Monochrome
    '0 0% 95%', '0 0% 80%', '0 0% 50%', '0 0% 10%',
    '0 0% 70%', '0 0% 40%', '0 0% 20%', '0 0% 98%',
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleColorSelect = (color: string) => {
        onChange(color);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-10 w-10 p-2"
                    style={{ backgroundColor: `hsl(${value})` }}
                    aria-label="Color picker"
                >
                   <Paintbrush className="h-5 w-5 text-white mix-blend-difference" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-2">
                    {colors.map((color) => (
                        <Button
                            key={color}
                            variant="outline"
                            size="icon"
                            type="button"
                            className={cn(
                                'h-8 w-8 cursor-pointer transition-transform hover:scale-110',
                                value === color && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                            )}
                            style={{ backgroundColor: `hsl(${color})` }}
                            onClick={() => handleColorSelect(color)}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
