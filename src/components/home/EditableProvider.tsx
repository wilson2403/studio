

'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { getContent, setContent } from '@/lib/firebase/firestore';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

type ContentObject = { [key: string]: string };
type ContentValue = string | ContentObject;

interface EditableContextType {
  isAdmin: boolean;
  content: Record<string, ContentValue>;
  updateContent: (id: string, value: ContentObject) => void;
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

  const fetchContent = useCallback(async (id: string, initialValue: string) => {
    if (!id || content[id]) return; 

    setContentState((prev) => ({
        ...prev,
        [id]: initialValue,
    }));
    
    const existingValue = await getContent(id);
    if (existingValue !== null) {
        setContentState((prev) => ({
            ...prev,
            [id]: existingValue,
        }));
    }
  }, [content]);

  const updateContent = async (id: string, value: ContentObject) => {
    setContentState((prev) => ({
        ...prev,
        [id]: value,
    }));

    try {
        await setContent(id, value);
    } catch (error) {
        console.error("Failed to save content:", error);
    }
  };

  return (
    <EditableContext.Provider value={{ isAdmin, content, updateContent, fetchContent }}>
      {children}
    </EditableContext.Provider>
  );
};
