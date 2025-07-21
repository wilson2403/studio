
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
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  const contentValue = content[id];
  let displayValue: string;
  let esValue: string;
  let enValue: string;

  if (typeof contentValue === 'object' && contentValue !== null) {
      displayValue = contentValue[lang] || contentValue['es'] || initialValue;
      esValue = contentValue['es'] || (lang === 'es' ? initialValue : '');
      enValue = contentValue['en'] || (lang === 'en' ? initialValue : '');
  } else {
      // Use initialValue if content is not an object or not yet loaded
      displayValue = initialValue;
      esValue = (typeof contentValue === 'string' && lang === 'es') ? contentValue : initialValue;
      enValue = (typeof contentValue === 'string' && lang === 'en') ? contentValue : '';
  }
  
  // Use a state for edit values to ensure they are set correctly on mount
  const [editValues, setEditValues] = useState({ es: '', en: '' });

  useEffect(() => {
      // This effect runs when contentValue changes (i.e., data is loaded from Firestore)
      if (typeof contentValue === 'object' && contentValue !== null) {
          setEditValues({ es: contentValue.es || '', en: contentValue.en || '' });
      } else if (typeof contentValue === 'string') {
          // If for some reason we still get a string, populate based on current language
          const defaultValues = { es: '', en: '' };
          defaultValues[lang] = contentValue;
          setEditValues(defaultValues);
      } else {
           // Fallback for initial load
           const defaultValues = { es: '', en: '' };
           defaultValues[lang] = initialValue;
           setEditValues(defaultValues);
      }
  }, [contentValue, initialValue, lang]);


  const handleSave = async () => {
    try {
        await updateContent(id, editValues);
        toast({ title: t('editableSuccess'), description: '' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: t('editableError'), description: '', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleEditClick = () => {
    // Ensure editValues are up-to-date before showing the form
    if (typeof contentValue === 'object' && contentValue !== null) {
        setEditValues({ es: contentValue.es || '', en: contentValue.en || '' });
    }
    setIsEditing(true);
  }

  const handleInputChange = (lang: 'es' | 'en', value: string) => {
    setEditValues(prev => ({ ...prev, [lang]: value }));
  }

  if (isEditing) {
    const InputComponent = Tag === 'p' || Tag === 'h3' ? Textarea : Input;

    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl items-center p-4 rounded-md border bg-card">
        <div className='w-full space-y-2'>
            <Label htmlFor={`${id}-es`}>Español</Label>
            <InputComponent 
                id={`${id}-es`}
                value={editValues.es} 
                onChange={(e) => handleInputChange('es', e.target.value)} 
                className={cn("bg-background text-foreground", Tag === 'p' ? 'text-lg p-2' : 'text-4xl md:text-6xl font-headline tracking-tight text-center h-auto p-2')}
            />
        </div>
        <div className='w-full space-y-2'>
            <Label htmlFor={`${id}-en`}>English</Label>
             <InputComponent 
                id={`${id}-en`}
                value={editValues.en} 
                onChange={(e) => handleInputChange('en', e.target.value)} 
                className={cn("bg-background text-foreground", Tag === 'p' ? 'text-lg p-2' : 'text-4xl md:text-6xl font-headline tracking-tight text-center h-auto p-2')}
            />
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} size="sm"><Save className="mr-2"/> {t('save')}</Button>
          <Button onClick={handleCancel} variant="outline" size="sm"><X className="mr-2"/> {t('cancel')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group flex items-center justify-center gap-2 w-full")}>
      <Tag className={className}>{displayValue}</Tag>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
