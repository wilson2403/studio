
import { Timestamp } from "firebase/firestore";

export type Plan = {
  name: string;
  price: number;
  priceUntil?: number;
  description: string;
};

export type Ceremony = {
  id: string;
  title: string;
  description: string;
  date?: string;
  price: number;
  priceType: 'exact' | 'from';
  features: string[];
  link: string;
  featured: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  plans?: Plan[];
  contributionText?: string;
  status: 'active' | 'finished';
};

export type PastCeremony = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  date?: string;
  mediaType?: 'image' | 'video';
};

export type Guide = {
  id: string;
  name: string;
  imageUrl: string;
};

export type UserStatus = 'Interesado' | 'Cliente' | 'Pendiente';

export type UserProfile = {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phone?: string;
    address?: string;
    isAdmin?: boolean;
    questionnaireCompleted?: boolean;
    status?: UserStatus;
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

export type QuestionnaireAnswers = {
    hasMedicalConditions: 'yes' | 'no';
    medicalConditionsDetails?: string;
    isTakingMedication: 'yes' | 'no';
    medicationDetails?: string;
    hasMentalHealthHistory: 'yes' | 'no';
    mentalHealthDetails?: string;
    mainIntention: string;
    hasPreviousExperience: 'yes' | 'no';
    previousExperienceDetails?: string;
};
