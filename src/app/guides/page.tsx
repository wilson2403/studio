
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getGuides, Guide, seedGuides } from '@/lib/firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { EditableTitle } from '@/components/home/EditableTitle';
import EditGuideDialog from '@/components/guides/EditGuideDialog';
import { EditableProvider } from '@/components/home/EditableProvider';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function GuidesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      try {
        let guidesData = await getGuides();
        if (guidesData.length === 0) {
          console.log('No guides found, seeding database...');
          await seedGuides();
          guidesData = await getGuides();
        }
        setGuides(guidesData);
      } catch (error) {
        console.error("Failed to fetch or seed guides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const handleGuideUpdate = (updatedGuide: Guide) => {
    setGuides(guides.map(g => g.id === updatedGuide.id ? updatedGuide : g));
    setEditingGuide(null);
  };
  
  const handleGuideDelete = (id: string) => {
    setGuides(guides.filter(g => g.id !== id));
    setEditingGuide(null);
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <section id="guias" className="container py-12 md:py-24">
         <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="h-12 w-1/2 bg-card/50 animate-pulse rounded-md"></div>
            <div className="h-8 w-2/3 bg-card/50 animate-pulse rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pl-20">
          {[...Array(4)].map((_, i) => (
             <Card key={i} className="flex flex-col items-center justify-center gap-8 p-6 rounded-2xl border-2 border-card-foreground/10 h-[350px] animate-pulse bg-card/50"></Card>
          ))}
        </div>
      </section>
    );
  }


  return (
    <EditableProvider>
      <div className="container py-12 md:py-24">
          <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in-0 duration-1000">
              <EditableTitle
                  tag="h1"
                  id="guidesPageTitle"
                  initialValue={t('guidesPageTitle')}
                  className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
              />
              <EditableTitle
                  tag="p"
                  id="guidesPageSubtitle"
                  initialValue={t('guidesPageSubtitle')}
                  className="max-w-2xl text-lg text-foreground/80 font-body"
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in-0 duration-1000 delay-300 pl-20">
              {guides.map((guide) => (
                  <Card key={guide.id} className="relative flex flex-col items-center justify-start text-center gap-6 p-6 rounded-2xl border-2 border-card-foreground/10 bg-card/80 backdrop-blur-sm shadow-lg group">
                      {isAdmin && (
                          <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-4 right-4 h-8 w-8 rounded-full z-10 bg-black/50 hover:bg-black/80"
                              onClick={() => setEditingGuide(guide)}
                          >
                              <Edit className="h-4 w-4" />
                          </Button>
                      )}
                      <div className="relative w-40 h-40 flex-shrink-0 mt-4">
                        <Image
                              src={guide.imageUrl}
                              alt={guide.name}
                              width={160}
                              height={160}
                              className="rounded-full object-cover border-4 border-primary/50 shadow-lg group-hover:scale-105 transition-transform duration-300"
                              data-ai-hint="spiritual guide portrait"
                          />
                      </div>
                      <div className="flex flex-col">
                          <CardTitle className="text-2xl font-headline tracking-wide text-primary">{guide.name}</CardTitle>
                          <CardContent className="p-0 mt-2">
                              <p className="font-body text-base text-foreground/80">{guide.description}</p>
                          </CardContent>
                      </div>
                  </Card>
              ))}
          </div>
          
          {editingGuide && (
              <EditGuideDialog
                  guide={editingGuide}
                  isOpen={!!editingGuide}
                  onClose={() => setEditingGuide(null)}
                  onUpdate={handleGuideUpdate}
                  onDelete={handleGuideDelete}
              />
          )}
      </div>
    </EditableProvider>
  );
}
