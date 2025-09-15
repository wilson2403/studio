
'use client';

import { useEditable } from './EditableProvider';
import { Button } from '../ui/button';
import { Edit, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EditableTitleProps {
  tag: 'h1' | 'h2' | 'p' | 'h3' | 'span';
  id: string;
  initialValue: string;
  className?: string;
  isInsideButton?: boolean;
}

export const EditableTitle = ({ tag: Tag, id, initialValue, className, isInsideButton = false }: EditableTitleProps) => {
  const { content, fetchContent, isAdmin } = useEditable();
  const [displayValue, setDisplayValue] = useState(initialValue);
  const router = useRouter();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';
  const t = (key: string, options?: any) => i18n.t(key, options) || key;

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
    
    setDisplayValue(t(newDisplayValue, { name: 'User' }));

  }, [content, id, lang, initialValue, t]);

  const handleEditClick = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement | HTMLSpanElement>) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/admin/content?search=${id}`);
  };

  const RenderTag = Tag;
  
  if (isInsideButton || Tag === 'span' || Tag === 'p') {
    return (
        <RenderTag className={cn("relative group inline-flex items-center gap-2", className)}>
            {displayValue.split('\n').map((line, index) => (
                <span key={index} className="block">{line}</span>
            ))}
            {isAdmin && (
                <span
                    className={cn(
                        'h-6 w-6 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ml-2',
                        isInsideButton ? 'bg-transparent' : 'hover:bg-accent'
                    )}
                    onClick={handleEditClick}
                >
                    <Edit className={cn("h-3 w-3", isInsideButton ? 'text-inherit' : 'text-accent-foreground')} />
                </span>
            )}
        </RenderTag>
    );
  }

  return (
    <div className={cn("relative group flex items-center justify-center gap-2 w-full")}>
      <RenderTag className={className}>
        {displayValue.split('\n').map((line, index) => (
          <span key={index} className="block">{line}</span>
        ))}
      </RenderTag>
      {isAdmin && (
        <span
            className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors',
                'absolute -right-10 top-1/2 -translate-y-1/2 hover:bg-accent'
            )}
            onClick={handleEditClick}
        >
            <Edit className={cn("h-4 w-4", 'text-accent-foreground')} />
        </span>
      )}
    </div>
  );
};
