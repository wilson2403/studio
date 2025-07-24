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
    '/artedesanar',
    '/login',
    '/register'
  ].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic routes for ceremonies
  const ceremonies = await getCeremonies('active'); 
  const ceremonyRoutes = ceremonies.map(ceremony => ({
    url: `${BASE_URL}/ceremonies/${ceremony.id}`, // Assuming you might have detail pages in the future
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as 'daily',
    priority: 0.9,
  }));
  
  // Note: For a real implementation, you would make `/ceremonies/[id]` a real page.
  // For now, this just helps Google understand these are important items.

  return [...staticRoutes, ...ceremonyRoutes];
}
