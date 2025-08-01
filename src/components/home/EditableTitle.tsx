
'use client';

import { useEditable } from './EditableProvider';
import { Button } from '../ui/button';
import { Edit, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface EditableTitleProps {
  tag: 'h1' | 'h2' | 'p' | 'h3' | 'span';
  id: string;
  initialValue: string;
  className?: string;
  isInsideButton?: boolean;
}

export const EditableTitle = ({ tag: Tag, id, initialValue, className, isInsideButton = false }: EditableTitleProps) => {
  const { isAdmin, content, updateContent, fetchContent } = useEditable();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ es: '', en: '' });
  const [displayValue, setDisplayValue] = useState(initialValue);
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';
  const t = (key: string) => i18n.t(key) || key;

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  useEffect(() => {
    const contentValue = content[id];
    let newDisplayValue: string;

    if (typeof contentValue === 'object' && contentValue !== null) {
        newDisplayValue = (contentValue as any)[lang] || (contentValue as any)['es'] || initialValue;
    } else if (typeof contentValue === 'string') {
        newDisplayValue = contentValue;
    } else {
        newDisplayValue = initialValue;
    }
    
    setDisplayValue(t(newDisplayValue));

  }, [content, id, lang, initialValue, t]);

  
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newContentValue = { ...editValues };
    
    try {
        await updateContent(id, newContentValue);
        toast({ title: t('editableSuccess'), description: '' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: t('editableError'), description: '', variant: 'destructive' });
    }
  };


  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(false);
  };
  
  const handleEditClick = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement | HTMLSpanElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    const currentContent = content[id];
    let esValue = '';
    let enValue = '';

    if (typeof currentContent === 'object' && currentContent !== null) {
        esValue = (currentContent as any).es || '';
        enValue = (currentContent as any).en || '';
    } else if (typeof currentContent === 'string') {
        esValue = currentContent;
        enValue = currentContent;
    }
    
    setEditValues({ es: esValue || t(initialValue), en: enValue || t(initialValue) });
    setIsEditing(true);
  }

  const editControls = (
    <div className="flex flex-col gap-4 w-full p-1">
        <div className='w-full space-y-4'>
            <div className='space-y-2'>
                <Label htmlFor={`${id}-es`}>Español</Label>
                <Textarea 
                    id={`${id}-es`}
                    value={editValues.es} 
                    onChange={(e) => setEditValues(prev => ({...prev, es: e.target.value}))} 
                    className="bg-background text-foreground text-sm p-2"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
             <div className='space-y-2'>
                <Label htmlFor={`${id}-en`}>English</Label>
                <Textarea
                    id={`${id}-en`}
                    value={editValues.en} 
                    onChange={(e) => setEditValues(prev => ({...prev, en: e.target.value}))} 
                    className="bg-background text-foreground text-sm p-2"
                     onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
        <div className="flex gap-2 mt-2 justify-end">
          <Button onClick={handleSave} size="sm"><Save className="mr-2 h-4 w-4"/> {t('save')}</Button>
          <Button onClick={handleCancel} variant="outline" size="sm"><X className="mr-2 h-4 w-4"/> {t('cancel')}</Button>
        </div>
    </div>
  );

  if (isEditing && !isInsideButton) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl items-center p-4 rounded-md border bg-card">
        {editControls}
      </div>
    );
  }
  
  const RenderTag = Tag;
  const WrapperTag = (Tag === 'p' || Tag === 'span') ? 'span' : 'div';

  const EditTrigger = ({ children }: { children: React.ReactNode }) => {
      if (isInsideButton) {
          return (
              <Popover open={isEditing} onOpenChange={setIsEditing}>
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    {children}
                  </PopoverTrigger>
                  <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
                    {editControls}
                  </PopoverContent>
              </Popover>
          )
      }
      return <>{children}</>;
  }


  return (
    <WrapperTag className={cn(
      "relative group flex items-center justify-center gap-2", 
      Tag !== 'p' && Tag !== 'span' && "w-full",
      (Tag === 'p' || Tag === 'span') && 'inline-block'
    )}>
      <RenderTag className={className}>
        {displayValue.split('\n').map((line, index) => (
          <span key={index} className="block">{line}</span>
        ))}
      </RenderTag>
      {isAdmin && (
        <EditTrigger>
            <span
                className={cn(
                    'h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer',
                    isInsideButton ? 'group-hover:bg-transparent' : 'absolute -right-10 top-1/2 -translate-y-1/2 group-hover:bg-accent'
                )}
                onClick={handleEditClick}
            >
                <Edit className={cn("h-4 w-4", isInsideButton ? 'text-inherit' : 'text-accent-foreground')} />
            </span>
        </EditTrigger>
      )}
    </WrapperTag>
  );
};
