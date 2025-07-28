

import { Timestamp } from "firebase/firestore";

export type Plan = {
  id: string;
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
  horario?: string;
  price: number;
  priceType: 'exact' | 'from';
  features: string[];
  link: string;
  locationLink?: string;
  downloadUrl?: string;
  featured: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'short video';
  videoFit?: 'cover' | 'contain';
  autoplay?: boolean;
  defaultMuted?: boolean;
  plans?: Plan[];
  contributionText?: string;
  status: 'active' | 'finished' | 'inactive';
  registerRequired?: boolean;
  showParticipantCount?: boolean;
  showAnalytics?: boolean;
  viewCount?: number;
  reserveClickCount?: number;
  whatsappClickCount?: number;
  assignedUsers?: UserProfile[];
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
  description: string;
  imageUrl: string;
};

export type UserStatus = 'Interesado' | 'Cliente' | 'Pendiente';
export type UserRole = 'user' | 'organizer' | 'admin';

export type UserProfile = {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phone?: string;
    address?: string;
    role?: UserRole;
    permissions?: {
        canEditCeremonies?: boolean;
        canEditCourses?: boolean;
        canEditUsers?: boolean;
        canViewChatHistory?: boolean;
    };
    questionnaireCompleted?: boolean;
    status?: UserStatus;
    preparationStep?: number;
    assignedCeremonies?: string[];
    completedCourses?: string[];
    videoProgress?: { [videoId: string]: number };
    hasLogs?: boolean;
    hasChats?: boolean;
}

export type ThemeSettings = {
    light: {
        background: string;
        foreground: string;
        card: string;
        cardForeground: string;
        popover: string;
        popoverForeground: string;
        primary: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        muted: string;
        mutedForeground: string;
        accent: string;
        accentForeground: string;
        destructive: string;
        destructiveForeground: string;
        border: string;
        input: string;
        ring: string;
    };
    dark: {
        background: string;
        foreground: string;
        card: string;
        cardForeground: string;
        popover: string;
        popoverForeground: string;
        primary: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        muted: string;
        mutedForeground: string;
        accent: string;
        accentForeground: string;
        destructive: string;
        destructiveForeground: string;
        border: string;
        input: string;
        ring: string;
    };
};

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
        photoURL?: string | null;
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
    updatedAt?: Timestamp;
};

export type ErrorLog = {
    id: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: Timestamp;
    status: 'new' | 'fixed';
}

export type InvitationMessage = {
    id: string;
    name: string;
    es: string;
    en: string;
}

export type CeremonyInvitationMessage = {
  id: string;
  name: string;
  es: string;
  en: string;
};

export type BackupData = {
    users: UserProfile[];
    ceremonies: Ceremony[];
    guides: Guide[];
    content: { id: string; value: any }[];
    settings: { id: string; value: any }[];
};

export type SectionClickLog = {
    sectionId: string;
    userId: string;
    timestamp: Timestamp;
};

export type SectionAnalytics = {
    sectionId: string;
    clickCount: number;
};

export type Course = {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    category: 'required' | 'optional';
    createdAt: Timestamp;
};

export type VideoProgress = {
    [videoId: string]: {
        time: number;
        updatedAt: Timestamp;
    }
}

export type SystemSettings = {
    firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };
    googleApiKey: string;
    resendApiKey: string;
    whatsappCommunityLink: string;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    whatsappNumber: string;
    navLinks: {
        home: { es: string; en: string };
        medicine: { es: string; en: string };
        guides: { es: string; en: string };
        ceremonies: { es: string; en: string };
        preparation: { es: string; en: string };
    };
};

export type AuditLog = {
    id: string;
    userId: string; // UID of the user who performed the action
    userDisplayName: string | null;
    action: string; // e.g., 'update_ceremony', 'delete_user', 'login'
    targetId?: string; // e.g., ceremony ID, user ID that was modified
    targetType?: string; // e.g., 'ceremony', 'user'
    changes?: Record<string, any>; // For 'update' actions, store what changed
    timestamp: Timestamp;
    page: string; // The page where the action was performed
}
