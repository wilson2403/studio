
'use client';

import { useEditable } from './EditableProvider';
import { Button } from '../ui/button';
import { Edit, Save, X } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Label } from '../ui/label';

interface EditableTitleProps {
  tag: 'h1' | 'h2' | 'p' | 'h3' | 'span';
  id: string;
  initialValue: string;
  className?: string;
}

export const EditableTitle = ({ tag: Tag, id, initialValue, className }: EditableTitleProps) => {
  const { isAdmin, content, updateContent, fetchContent } = useEditable();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ es: '', en: '' });
  const [displayValue, setDisplayValue] = useState(initialValue);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  useEffect(() => {
    fetchContent(id, initialValue);
  }, [id, initialValue, fetchContent]);

  useEffect(() => {
    const contentValue = content[id];
    let newDisplayValue;

    if (typeof contentValue === 'object' && contentValue !== null) {
      newDisplayValue = (contentValue as any)[lang] || (contentValue as any).es || initialValue;
    } else if (typeof contentValue === 'string' && contentValue) {
      newDisplayValue = contentValue;
    } else {
      newDisplayValue = initialValue;
    }
    setDisplayValue(newDisplayValue);
  }, [content, id, lang, initialValue]);
  
  const handleSave = async () => {
    const newContentValue = { ...editValues };
    
    try {
        await updateContent(id, newContentValue);
        toast({ title: t('editableSuccess'), description: '' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: t('editableError'), description: '', variant: 'destructive' });
    }
  };


  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    const currentContent = content[id];
    let esValue = '';
    let enValue = '';

    if (typeof currentContent === 'object' && currentContent !== null) {
        esValue = (currentContent as any).es || '';
        enValue = (currentContent as any).en || '';
    } else if (typeof currentContent === 'string') {
        // Handle case where it might be a simple string
        esValue = currentContent;
        enValue = currentContent;
    }
    
    setEditValues({ es: esValue || initialValue, en: enValue || initialValue });
    setIsEditing(true);
  }

  if (isEditing) {
    const InputComponent = (Tag === 'p' || Tag === 'h3') ? Textarea : Input;

    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl items-center p-4 rounded-md border bg-card">
        <div className='w-full space-y-4'>
            <div className='space-y-2'>
                <Label htmlFor={`${id}-es`}>Español</Label>
                <InputComponent 
                    id={`${id}-es`}
                    value={editValues.es} 
                    onChange={(e) => setEditValues(prev => ({...prev, es: e.target.value}))} 
                    className={cn("bg-background text-foreground", Tag === 'p' ? 'text-lg p-2' : 'text-4xl md:text-6xl font-headline tracking-tight text-center h-auto p-2')}
                />
            </div>
             <div className='space-y-2'>
                <Label htmlFor={`${id}-en`}>English</Label>
                <InputComponent 
                    id={`${id}-en`}
                    value={editValues.en} 
                    onChange={(e) => setEditValues(prev => ({...prev, en: e.target.value}))} 
                    className={cn("bg-background text-foreground", Tag === 'p' ? 'text-lg p-2' : 'text-4xl md:text-6xl font-headline tracking-tight text-center h-auto p-2')}
                />
            </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} size="sm"><Save className="mr-2"/> {t('save')}</Button>
          <Button onClick={handleCancel} variant="outline" size="sm"><X className="mr-2"/> {t('cancel')}</Button>
        </div>
      </div>
    );
  }


  return (
    <div className={cn("relative group flex items-center justify-center gap-2", Tag !== 'p' && "w-full")}>
      <Tag className={className}>{displayValue}</Tag>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute right-[-40px]"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

    