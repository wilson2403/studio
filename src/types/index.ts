
import { Timestamp } from "firebase/firestore";

export type Ceremony = {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  link: string;
  featured: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
};

export type PastCeremony = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
};

export type Guide = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type UserProfile = {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phone?: string;
    address?: string;
    isAdmin?: boolean;
}

export type ThemeSettings = {
    primary: string;
    background: string;
    accent: string;
}

export type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export type Chat = {
    id: string;
    messages: ChatMessage[];
    user: {
        uid: string;
        email: string | null;
        displayName: string | null;
    } | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
