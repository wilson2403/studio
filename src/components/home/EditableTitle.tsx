
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

  const contentValue = content[id];
  let displayValue: string;
  
  if(typeof contentValue === 'object' && contentValue !== null) {
      displayValue = contentValue[lang] || contentValue['es'] || initialValue;
  } else if (typeof contentValue === 'string') {
      displayValue = contentValue;
  } else {
      displayValue = initialValue;
  }

  const [editValue, setEditValue] = useState(displayValue);

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue]);

  useEffect(() => {
    setEditValue(displayValue);
  }, [displayValue]);


  const handleSave = async () => {
    try {
        await updateContent(id, editValue, lang);
        toast({ title: t('editableSuccess'), description: '' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: t('editableError'), description: '', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditValue(displayValue);
    setIsEditing(false);
  };
  
  const handleEditClick = () => {
    setEditValue(displayValue); // Ensure we're editing the latest value for the current language
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 w-full max-w-3xl items-center">
         {Tag === 'p' ? (
             <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-lg bg-card text-card-foreground p-2 rounded-md"/>
         ) : (
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-4xl md:text-6xl font-headline tracking-tight text-center h-auto bg-card text-card-foreground p-2 rounded-md" />
         )}
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
