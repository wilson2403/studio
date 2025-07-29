import { getCeremonies } from '@/lib/firebase/firestore';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://artedesanar.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    '',
    '/ayahuasca',
    '/guides',
    '/ceremonies',
    '/preparation',
    '/login',
    '/register'
  ].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic routes for ceremonies
  const ceremonies = await getCeremonies(); 
  const ceremonyRoutes = ceremonies.map(ceremony => ({
    url: `${BASE_URL}/ceremonias/${ceremony.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as 'daily',
    priority: 0.9,
  }));
  
  const ceremonyMemoryRoutes = ceremonies.map(ceremony => ({
    url: `${BASE_URL}/artesanar/${ceremony.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...ceremonyRoutes, ...ceremonyMemoryRoutes];
}
    
