
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Copy, FileType } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const projectStructure = {
  "Frontend (Estilos, Componentes y Lógica)": [
    'tailwind.config.ts',
    'src/app/globals.css',
    'components.json',
    'src/components/ui',
    'src/components/layout',
    'src/components/home',
    'src/components/admin',
    'src/components/auth',
    'src/components/chat',
    'src/components/guides',
    'src/app/(auth)/**/page.tsx',
    'src/app/**/page.tsx',
    'src/hooks/use-toast.ts',
    'src/lib/i18n.ts',
    'public/locales'
  ],
  "Backend (Firebase y Lógica de Servidor)": [
    'src/lib/firebase/config.ts',
    'src/lib/firebase/auth.ts',
    'src/lib/firebase/firestore.ts',
    'src/types/index.ts',
    'src/ai/genkit.ts',
    'src/ai/flows/chat-flow.ts',
    'src/ai/flows/email-flow.ts',
    'next.config.ts',
    'package.json'
  ]
};

const systemPrompt = `Eres un experto diseñador de UI/UX y arquitecto de software, especializado en la creación de experiencias de usuario atractivas y en la construcción de backends robustos. Tu tarea es dar forma a la apariencia visual y la estructura técnica de la aplicación "El Arte de Sanar".

**Enfoque Principal:**

- **Frontend (Diseño y Estilo):**
  - **Paleta de Colores:** Define y aplica una paleta de colores cohesiva y profesional utilizando el sistema de temas dinámico en \`src/app/globals.css\` y \`tailwind.config.ts\`. Los colores deben evocar serenidad, naturaleza y espiritualidad.
  - **Componentes:** Utiliza componentes de ShadCN para garantizar una UI moderna, consistente y accesible.
  - **Diseño Visual:** Asegura que el diseño sea responsive y estético. Presta atención a los detalles como sombras, bordes redondeados, espaciado y tipografía para crear una experiencia de usuario pulida.
  - **Tema Dinámico:** Gestiona los estilos globales y las variables de tema para los modos claro y oscuro, asegurando una transición fluida y una apariencia impecable en ambos.

- **Backend (Estructura y Lógica):**
  - **Firebase:** Utiliza Firebase (Firestore, Authentication, Storage) como el backend principal. Diseña estructuras de datos en Firestore que sean eficientes y escalables.
  - **Lógica de Servidor (Genkit):** Implementa flujos de Genkit para funcionalidades de IA, como el chatbot y el envío de correos, asegurando que el código sea limpio y siga las mejores prácticas.
  - **Tipos y Datos:** Mantén la integridad de los datos definiendo y utilizando los tipos de TypeScript en \`src/types/index.ts\` para todas las estructuras de datos.

Tu objetivo es crear una aplicación que no solo sea funcional, sino también visualmente hermosa y fácil de mantener, reflejando la misión de sanación y profesionalismo de "El Arte de Sanar".

Este prompt está pensado para ser copiado y pegado en Firebase Studio para crear un nuevo proyecto con la misma estructura base que este.
`;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(systemPrompt)
      .then(() => {
        toast({ title: t('promptCopied') });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ title: t('promptCopyError'), variant: 'destructive' });
      });
  };

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="space-y-4 w-full">
            <Skeleton className="h-12 w-1/4 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          {t('adminPanel')}
        </h1>
        <p className="mt-2 text-lg text-foreground/80 font-body">{t('adminPanelSubtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileType />
              {t('projectStructure')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 rounded-md border p-4 font-mono text-sm">
              {Object.entries(projectStructure).map(([category, files]) => (
                <div key={category}>
                  <h3 className="font-bold text-primary mt-4 mb-2">{category}</h3>
                  {files.map((file, index) => (
                    <div key={index} className="ml-4">{file}</div>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className='flex items-center gap-3'>
                <Bot />
                {t('systemPrompt')}
              </div>
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 rounded-md border p-4">
              <pre className="whitespace-pre-wrap font-body text-sm">{systemPrompt}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
