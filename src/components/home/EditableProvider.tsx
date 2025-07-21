'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { getContent, setContent } from '@/lib/firebase/firestore';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

interface EditableContextType {
  isAdmin: boolean;
  content: Record<string, string>;
  updateContent: (id: string, value: string) => void;
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
  const [content, setContentState] = useState<Record<string, string>>({});

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

  const updateContent = async (id: string, value: string) => {
    setContentState((prev) => ({ ...prev, [id]: value }));
    await setContent(id, value);
  };

  return (
    <EditableContext.Provider value={{ isAdmin, content, updateContent, fetchContent }}>
      {children}
    </EditableContext.Provider>
  );
};
