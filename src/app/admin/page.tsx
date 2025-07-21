
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Copy, FileType } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import SettingsTabs from '@/components/admin/SettingsTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const projectStructure = [
  'README.md',
  'apphosting.yaml',
  'components.json',
  'next.config.ts',
  'package.json',
  'public/locales/en/common.json',
  'public/locales/es/common.json',
  'src/ai/dev.ts',
  'src/ai/genkit.ts',
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/admin/chat/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/ayahuasca/page.tsx',
  'src/app/ceremonies/page.tsx',
  'src/app/globals.css',
  'src/app/guides/page.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/preparation/page.tsx',
  'src/app/questionnaire/page.tsx',
  'src/components/admin/ColorPicker.tsx',
  'src/components/admin/QuestionnaireDialog.tsx',
  'src/components/admin/SettingsTabs.tsx',
  'src/components/auth/RegistrationPromptDialog.tsx',
  'src/components/auth/WelcomeTour.tsx',
  'src/components/chat/Chatbot.tsx',
  'src/components/guides/EditGuideDialog.tsx',
  'src/components/home/Ceremonies.tsx',
  'src/components/home/CeremonyDetailsDialog.tsx',
  'src/components/home/Contact.tsx',
  'src/components/home/EditCeremonyDialog.tsx',
  'src/components/home/EditableProvider.tsx',
  'src/components/home/EditableTitle.tsx',
  'src/components/home/ExploreMore.tsx',
  'src/components/home/Hero.tsx',
  'src/components/home/VideoPlayer.tsx',
  'src/components/icons/FacebookIcon.tsx',
  'src/components/icons/GoogleIcon.tsx',
  'src/components/icons/Logo.tsx',
  'src/components/icons/WhatsappIcon.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/I18nProvider.tsx',
  'src/components/layout/LanguageSwitcher.tsx',
  'src/components/layout/ThemeProvider.tsx',
  'src/components/layout/ThemeSwitcher.tsx',
  'src/hooks/use-mobile.tsx',
  'src/hooks/use-toast.ts',
  'src/lib/firebase/auth.ts',
  'src/lib/firebase/config.ts',
  'src/lib/firebase/firestore.ts',
  'src/lib/i18n.ts',
  'src/lib/utils.ts',
  'src/types/index.ts',
  'tailwind.config.ts',
  'tsconfig.json',
];

const systemPrompt = `Eres un experto desarrollador de aplicaciones web full-stack especializado en el ecosistema de Next.js, Firebase y Tailwind CSS (con ShadCN). Estás creando una aplicación web para "El Arte de Sanar", un centro de sanación espiritual que ofrece ceremonias de Ayahuasca.

**Objetivo Principal:** Crear un sitio web visualmente atractivo, profesional y completamente editable para promocionar las ceremonias, guías y filosofía del centro, permitiendo a los administradores gestionar el contenido dinámico directamente desde la interfaz.

**Stack Tecnológico:**
- **Framework:** Next.js 15+ con App Router.
- **Lenguaje:** TypeScript.
- **UI:** Componentes de ShadCN (copiados en \`src/components/ui\`).
- **Estilos:** Tailwind CSS con un sistema de temas dinámico gestionado desde Firebase.
- **Backend y Base de Datos:** Firebase (Firestore, Authentication, Storage).
- **IA:** Genkit para flujos de chatbot y envío de correos.
- **Internacionalización:** i18next para soportar español e inglés.

---

### **Estructura de Datos y Tipos (src/types/index.ts)**

- **Ceremony**: Representa un evento.
  - \`id: string\`, \`title: string\`, \`description: string\`, \`date?: string\`, \`horario?: string\`, \`price: number\`, \`priceType: 'exact' | 'from'\`, \`link: string\`, \`featured: boolean\`, \`mediaUrl?: string\`, \`mediaType?: 'image' | 'video'\`, \`status: 'active' | 'finished' | 'inactive'\`, \`plans?: Plan[]\`.
- **Plan**: Define un plan de precios para una ceremonia.
  - \`name: string\`, \`price: number\`, \`description: string\`.
- **Guide**: Perfil de un guía espiritual.
  - \`id: string\`, \`name: string\`, \`description: string\`, \`imageUrl: string\`.
- **UserProfile**: Datos del usuario en Firestore.
  - \`uid: string\`, \`email: string\`, \`displayName?: string\`, \`isAdmin?: boolean\`, \`status?: 'Interesado' | 'Cliente' | 'Pendiente'\`.
- **ThemeSettings**: Objeto para almacenar los colores del tema. Contiene dos objetos, \`light\` y \`dark\`, cada uno con claves para los colores HSL (ej: \`primary\`, \`background\`, \`card\`, etc.).

---

### **Controles y Funcionalidades Clave**

1.  **Contenido Editable en Vivo (\`EditableTitle\` y \`EditableProvider\`):**
    -   El \`EditableProvider\` gestiona el estado de edición y la comunicación con Firestore.
    -   El componente \`EditableTitle\` envuelve el texto. Si el usuario es administrador, muestra un botón de edición.
    -   Al hacer clic en "Editar", el texto se convierte en campos de entrada para español e inglés. Los cambios se guardan en la colección \`content\` de Firestore como un objeto \`{ es: '...', en: '...' }\`.
    -   El contenido se recupera usando la clave \`id\` proporcionada a \`EditableTitle\`.

2.  **Gestión de Ceremonias (Páginas \`/\`, \`/ceremonies\` y diálogos):**
    -   Las ceremonias se obtienen de la colección \`ceremonies\` en Firestore.
    -   Los administradores ven botones de "Editar" en cada tarjeta de ceremonia, que abren el diálogo \`EditCeremonyDialog\`.
    -   Este diálogo permite modificar todos los campos de la ceremonia, incluyendo título, descripción, precio, estado (\`active\`, \`finished\`, \`inactive\`), y gestionar una lista de características (\`features\`).
    -   Los medios (imagen/video) se pueden añadir subiendo un archivo (a Firebase Storage) o pegando una URL.
    -   Se pueden añadir, duplicar y eliminar ceremonias.

3.  **Gestión de Guías (Página \`/guides\`):**
    -   Similar a las ceremonias, los administradores pueden editar los perfiles de los guías (nombre, descripción y foto de perfil) a través del diálogo \`EditGuideDialog\`.

4.  **Autenticación y Roles:**
    -   La autenticación se gestiona con Firebase Authentication (Google y correo/contraseña).
    -   El rol de "administrador" se asigna a un correo específico (\`wilson2403@gmail.com\`) o a través de un booleano \`isAdmin\` en el perfil de usuario en Firestore.

5.  **Personalización del Tema (Página \`/admin\`):**
    -   La pestaña "Tema" en el panel de administración permite cambiar la paleta de colores completa de la aplicación para los modos claro y oscuro.
    -   Se utiliza un selector de color (\`ColorPicker\`) para facilitar la elección.
    -   Los cambios se guardan en el documento \`theme\` dentro de la colección \`settings\` en Firestore.
    -   El componente \`ThemeProvider\` carga estos ajustes y los inyecta como variables CSS en el documento.

6.  **Chatbot con IA (\`Chatbot.tsx\`):**
    -   Un chatbot flotante (visible solo para administradores) utiliza un flujo de Genkit (\`chat-flow.ts\`) para actuar como guía espiritual.
    -   Mantiene el historial de la conversación en la colección \`chats\` de Firestore.

Tu tarea es mantener y extender esta aplicación, asegurando que el código sea limpio, mantenible y siga las mejores prácticas del stack definido.
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
      
      <SettingsTabs user={user} />

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
              {projectStructure.map((file, index) => (
                <div key={index}>{file}</div>
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
