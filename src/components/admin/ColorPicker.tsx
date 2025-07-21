
'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';

const colors = [
    // Greens
    '125 33% 74%', // Soft Green (Default Light Primary)
    '150 40% 45%', // Muted Green (Default Dark Primary)
    '145 60% 35%', // Forest Green
    '90 50% 60%',  // Lime Green
    // Creams & Whites
    '40 33% 98%', // Creamy White (Default Light Background)
    '20 14.3% 4.1%', // Near Black (Default Dark Background)
    '60 30% 96%',  // Ivory
    '0 0% 100%',   // White
    // Golds & Yellows
    '47 62% 52%', // Pale Gold (Default Light Accent)
    '45 90% 60%', // Bright Yellow
    '35 70% 55%', // Deep Gold
    '40 50% 75%', // Light Gold
    // Blues & Purples
    '210 40% 50%', // Sky Blue
    '240 50% 65%', // Lavender
    '265 60% 55%', // Deep Purple
    '190 70% 45%', // Teal
    // Reds & Oranges
    '0 70% 60%',   // Coral Red
    '20 80% 60%',  // Sunset Orange
    '340 80% 70%', // Soft Pink
    '350 75% 55%', // Muted Rose
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
                <button
                    type="button"
                    className="h-10 w-10 rounded-md border border-input p-2 flex items-center justify-center"
                    style={{ backgroundColor: `hsl(${value})` }}
                    aria-label="Color picker"
                >
                   <Paintbrush className="h-5 w-5 text-white mix-blend-difference" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={cn(
                                'h-8 w-8 rounded-md border border-muted-foreground/20 cursor-pointer transition-transform hover:scale-110',
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
