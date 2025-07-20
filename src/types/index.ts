
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
