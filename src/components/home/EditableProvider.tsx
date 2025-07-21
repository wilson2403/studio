'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { getContent, setContent } from '@/lib/firebase/firestore';
import { translateText } from '@/ai/flows/translate-flow';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

type ContentValue = string | { [key: string]: string };

interface EditableContextType {
  isAdmin: boolean;
  content: Record<string, ContentValue>;
  updateContent: (id: string, value: string, lang: string) => void;
  fetchContent: (id: string, initialValue: string) => void;
}

const EditableContext = createContext<EditableContextType | null>(null);

export const useEditable = () => {
  const context = useContext(EditableContext);
  if (!context) {
    throw new Error('useEditable must be used within an EditableProvider');
  }
  return context;
};

export const EditableProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [content, setContentState] = useState<Record<string, ContentValue>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  const fetchContent = async (id: string, initialValue: string) => {
    if (!id) return; // Guard clause to prevent error
    const existingValue = await getContent(id);
    setContentState((prev) => ({
      ...prev,
      [id]: existingValue ?? initialValue,
    }));
  };

  const updateContent = async (id: string, value: string, lang: string) => {
    const otherLang = lang === 'es' ? 'en' : 'es';
    
    // First, update the local state for immediate feedback
    setContentState((prev) => {
        const currentContent = prev[id] || {};
        const newContent = typeof currentContent === 'object' ? { ...currentContent } : {};
        newContent[lang] = value;
        return { ...prev, [id]: newContent };
    });

    try {
        // Translate the text
        const { translatedText } = await translateText({
            text: value,
            sourceLang: lang,
            targetLang: otherLang
        });

        // Prepare the full content object to be saved
        const fullContent = {
            [lang]: value,
            [otherLang]: translatedText,
        };

        // Update local state again with the translated text
        setContentState((prev) => ({
            ...prev,
            [id]: fullContent,
        }));
        
        // Save the full object to Firestore
        await setContent(id, fullContent);

    } catch (error) {
        console.error("Failed to translate or save content:", error);
        // If translation fails, just save the edited value
        await setContent(id, { [lang]: value });
    }
};

  return (
    <EditableContext.Provider value={{ isAdmin, content, updateContent, fetchContent }}>
      {children}
    </EditableContext.Provider>
  );
};
