
'use client';

import { useEditable } from '@/components/home/EditableProvider';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * A custom hook to get editable content as a string, respecting the current language.
 * It fetches the content from Firestore if it's not already loaded.
 *
 * @param id The unique identifier for the content.
 * @param initialValue The default value to use while loading or if no content is found.
 * @returns The translated and editable string content.
 */
export const useEditableContent = (id: string, initialValue: string) => {
  const { content, fetchContent } = useEditable();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    if (id) {
        fetchContent(id, initialValue);
    }
  }, [id, initialValue, fetchContent]);

  const contentValue = content[id];
  let displayValue: string;
  
  if (typeof contentValue === 'object' && contentValue !== null) {
      displayValue = (contentValue as any)[lang] || (contentValue as any)['es'] || initialValue;
  } else if (typeof contentValue === 'string') {
      displayValue = contentValue;
  } else {
      displayValue = initialValue;
  }

  return displayValue;
};
