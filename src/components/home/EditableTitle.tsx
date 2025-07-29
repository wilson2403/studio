
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

interface EditableTitleProps {
  tag: 'h1' | 'h2' | 'p' | 'h3';
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
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  useEffect(() => {
    const contentValue = content[id];
    let newDisplayValue: string;

    if (typeof contentValue === 'object' && contentValue !== null) {
        // It's a structured content object like { es: 'Hola', en: 'Hello' }
        newDisplayValue = (contentValue as any)[lang] || (contentValue as any)['es'] || initialValue;
    } else if (typeof contentValue === 'string') {
        // It's a simple string, probably from initial state or older data
        newDisplayValue = contentValue;
    } else {
        // No content found, use the initial value
        newDisplayValue = initialValue;
    }
    
    // The initialValue can either be a translation KEY or a pre-translated string.
    // We try to translate it. If it's a key, t() will work. If it's already translated,
    // t() will just return the same string, which is fine.
    setDisplayValue(t(newDisplayValue));

  }, [content, id, lang, initialValue, t]);

  
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
        esValue = currentContent;
        enValue = currentContent;
    }
    
    setEditValues({ es: esValue || t(initialValue), en: enValue || t(initialValue) });
    setIsEditing(true);
  }

  if (isEditing) {
    const InputComponent = (Tag === 'p' || Tag === 'h3') ? Textarea : Input;

    // Use a 'span' wrapper when editing a 'p' tag to avoid nesting block elements
    const EditWrapper = Tag === 'p' ? 'span' : 'div';

    return (
      <EditWrapper className="flex flex-col gap-4 w-full max-w-3xl items-center p-4 rounded-md border bg-card">
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
      </EditWrapper>
    );
  }

  if (Tag === 'p' && !isAdmin) {
    // Return a fragment or just text if it's a non-admin view of a paragraph
    return <>{displayValue}</>;
  }
  
  if (Tag === 'p' && isAdmin) {
    return (
        <span className={cn("relative group inline-flex items-center justify-center gap-2", className)}>
            <span className={className}>{displayValue}</span>
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditClick}
                >
                <Edit className="h-4 w-4" />
            </Button>
        </span>
    )
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
