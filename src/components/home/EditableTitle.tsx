
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
  
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  // State for the value to be displayed, initialized with the translation
  const [displayValue, setDisplayValue] = useState(t(initialValue));
  
  // State for the value in the input field when editing
  const [editValue, setEditValue] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  useEffect(() => {
    const contentValue = content[id];
    let newDisplayValue: string;

    if (typeof contentValue === 'object' && contentValue !== null) {
        // If content is an object (e.g., {es: 'Hola', en: 'Hello'}), use the value for the current language
        newDisplayValue = (contentValue as any)[lang] || (contentValue as any)['es'] || t(initialValue);
    } else if (typeof contentValue === 'string' && contentValue) {
        // If it's a simple string (like a URL), use it directly
        newDisplayValue = contentValue;
    } else {
        // Fallback to the translated initial value
        newDisplayValue = t(initialValue);
    }
    
    // Only update if the value is meaningful and different
    if (newDisplayValue && newDisplayValue !== id) {
       setDisplayValue(newDisplayValue);
    }
  }, [content, id, lang, initialValue, t]);

  // Ensure displayValue updates when language changes
  useEffect(() => {
      setDisplayValue(t(initialValue));
  }, [lang, initialValue, t]);

  
  const handleSave = async () => {
    if (id === 'whatsappCommunityLink' || id === 'instagramUrl' || id === 'facebookUrl' || id === 'whatsappNumber') {
        const newValue = { es: editValue, en: editValue };
        await updateContent(id, newValue);
    } else {
        const currentContent = content[id] || {};
        const newContentValue = { 
            ...(typeof currentContent === 'object' ? currentContent : { es: initialValue, en: initialValue }),
            [lang]: editValue 
        };
        
        try {
            await updateContent(id, newContentValue);
        } catch (error) {
            toast({ title: t('editableError'), description: '', variant: 'destructive' });
        }
    }
    toast({ title: t('editableSuccess'), description: '' });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleEditClick = () => {
    setEditValue(displayValue); // Set the editing value to what is currently displayed
    setIsEditing(true);
  }

  if (isEditing) {
    const InputComponent = (Tag === 'p' || Tag === 'h3' || id.includes('Url') || id.includes('Link') || id.includes('Number')) ? Textarea : Input;
    const currentLanguageName = lang === 'es' ? 'Español' : 'English';
    const label = id.includes('Url') || id.includes('Link') || id.includes('Number') ? t(id) : currentLanguageName;


    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl items-center p-4 rounded-md border bg-card">
        <div className='w-full space-y-2'>
            <Label htmlFor={`${id}-${lang}`}>{label}</Label>
            <InputComponent 
                id={`${id}-${lang}`}
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)} 
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
