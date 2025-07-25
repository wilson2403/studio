
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
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  const contentValue = content[id];
  let displayValue: string;
  
  if (id === 'whatsappCommunityLink') {
    displayValue = contentValue as string || initialValue;
  } else if (typeof contentValue === 'object' && contentValue !== null) {
      displayValue = (contentValue as any)[lang] || (contentValue as any)['es'] || initialValue;
  } else if (typeof contentValue === 'string') {
      displayValue = contentValue;
  } else {
      displayValue = initialValue;
  }
  
  const handleSave = async () => {
    if (id === 'whatsappCommunityLink') {
        await updateContent(id, { es: editValue, en: editValue });
    } else {
        if (!contentValue) return;

        let newContentValue: { [key: string]: string; };

        if (typeof contentValue === 'object' && contentValue !== null) {
            newContentValue = { ...(contentValue as object), [lang]: editValue };
        } else {
            newContentValue = { [lang]: editValue };
        }
        
        try {
            await updateContent(id, newContentValue);
            toast({ title: t('editableSuccess'), description: '' });
            setIsEditing(false);
        } catch (error) {
            toast({ title: t('editableError'), description: '', variant: 'destructive' });
        }
    }
    toast({ title: t('editableSuccess'), description: '' });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(displayValue);
  };
  
  const handleEditClick = () => {
    setEditValue(displayValue);
    setIsEditing(true);
  }

  if (isEditing) {
    const InputComponent = (Tag === 'p' || Tag === 'h3' || id === 'whatsappCommunityLink') ? Textarea : Input;
    const currentLanguageName = lang === 'es' ? 'Español' : 'English';
    const label = id === 'whatsappCommunityLink' ? t('whatsappCommunityLink') : currentLanguageName;


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
