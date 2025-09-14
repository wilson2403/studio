
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
  const WrapperTag = isInsideButton || Tag === 'span' ? 'span' : 'div';

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
        <span
            className={cn(
                'h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer',
                isInsideButton ? 'group-hover:bg-transparent' : 'absolute -right-10 top-1/2 -translate-y-1/2 group-hover:bg-accent'
            )}
            onClick={handleEditClick}
        >
            <Edit className={cn("h-4 w-4", isInsideButton ? 'text-inherit' : 'text-accent-foreground')} />
        </span>
      )}
    </WrapperTag>
  );
};
