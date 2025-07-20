
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, FileTree, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  'src/app/admin/page.tsx',
  'src/app/ayahuasca/page.tsx',
  'src/app/globals.css',
  'src/app/guides/page.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/preparation/page.tsx',
  'src/components/auth/RegistrationPromptDialog.tsx',
  'src/components/guides/EditGuideDialog.tsx',
  'src/components/home/AyahuascaInfo.tsx',
  'src/components/home/Ceremonies.tsx',
  'src/components/home/CeremonyDetailsDialog.tsx',
  'src/components/home/Contact.tsx',
  'src/components/home/EditCeremonyDialog.tsx',
  'src/components/home/EditableProvider.tsx',
  'src/components/home/EditableTitle.tsx',
  'src/components/home/PastCeremonies.tsx',
  'src/components/home/PreparationCta.tsx',
  'src/components/icons/GoogleIcon.tsx',
  'src/components/icons/Logo.tsx',
  'src/components/icons/WhatsappIcon.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/I18nProvider.tsx',
  'src/components/layout/LanguageSwitcher.tsx',
  'src/components/ui/accordion.tsx',
  'src/components/ui/alert-dialog.tsx',
  'src/components/ui/alert.tsx',
  'src/components/ui/avatar.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/calendar.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/carousel.tsx',
  'src/components/ui/chart.tsx',
  'src/components/ui/checkbox.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/menubar.tsx',
  'src/components/ui/popover.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/separator.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/slider.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/table.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/toast.tsx',
  'src/components/ui/toaster.tsx',
  'src/components/ui/tooltip.tsx',
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

const systemPrompt = `
Eres un experto desarrollador de aplicaciones web full-stack especializado en el ecosistema de Next.js, Firebase y Tailwind CSS (con ShadCN). Estás creando una aplicación web para "El Arte de Sanar", un centro de sanación espiritual que ofrece ceremonias de Ayahuasca.

**Objetivo Principal:** Crear un sitio web visualmente atractivo, profesional y completamente editable para promocionar las ceremonias, guías y filosofía del centro, permitiendo a los administradores gestionar el contenido dinámico directamente desde la interfaz.

**Stack Tecnológico:**
- **Framework:** Next.js con App Router.
- **Lenguaje:** TypeScript.
- **UI:** Componentes de ShadCN.
- **Estilos:** Tailwind CSS con un tema oscuro y místico (verdes, tonos tierra, etc.).
- **Backend y Base de Datos:** Firebase (Firestore para la base de datos, Authentication para usuarios, Storage para archivos).
- **Internacionalización:** i18next para soportar español e inglés.

**Estructura de Páginas y Componentes:**
- **Página de Inicio (\`/\`):** La página principal. Contiene un carrusel de videos de "películas" que muestra 3 videos a la vez. También incluye secciones para ceremonias, una llamada a la acción para la página de preparación y una sección de contacto.
- **Página de Ayahuasca (\`/ayahuasca\`):** Página informativa que detalla qué es la Ayahuasca, sus beneficios y cómo funcionan las ceremonias.
- **Página de Guías (\`/guides\`):** Muestra los perfiles de los guías espirituales del centro.
- **Página de Preparación (\`/preparation\`):** Una guía detallada sobre cómo prepararse para una ceremonia, incluyendo dieta, preparación mental y qué llevar.
- **Páginas de Autenticación (\`/login\`, \`/register\`):** Formularios para que los usuarios y administradores inicien sesión o se registren.
- **Página de Administración (\`/admin\`):** Una página protegida visible solo para administradores. Muestra la estructura de archivos del proyecto y este mismo prompt.

**Funcionalidades Clave:**
1.  **Contenido Editable en Vivo:**
    -   Los administradores (identificados por \`wilson2403@gmail.com\`) ven botones de "Editar" junto a casi todo el contenido textual.
    -   Al hacer clic, el texto se convierte en un campo de entrada (\`input\` o \`textarea\`).
    -   Los cambios se guardan en tiempo real en una colección de 'content' en Firestore.
    -   El componente \`EditableProvider\` gestiona el estado de edición y la lógica de guardado.

2.  **Gestión de Ceremonias:**
    -   Las ceremonias se muestran en tarjetas.
    -   Los administradores pueden añadir, editar, duplicar y eliminar ceremonias a través de un diálogo modal.
    -   Cada ceremonia puede tener un título, descripción, precio ("desde ₡80.000"), lista de características, un enlace de reserva (WhatsApp) y un medio asociado (imagen o video desde una URL de YouTube, TikTok, Facebook o un archivo subido).
    -   Una ceremonia puede ser marcada como "Destacada" para resaltar visualmente.

3.  **Gestión de Guías:**
    -   Similar a las ceremonias, los administradores pueden editar los perfiles de los guías, incluyendo su nombre, descripción y foto de perfil (que se puede subir).

4.  **Carrusel de Videos Editable:**
    -   La sección de inicio muestra un carrusel de videos de "recuerdos de ceremonias".
    -   Los administradores pueden añadir, editar, duplicar o eliminar videos del carrusel.
    -   Los videos se pueden añadir subiendo un archivo o pegando una URL (YouTube, Streamable, etc.).

5.  **Autenticación y Roles:**
    -   Soporte para registro e inicio de sesión con correo/contraseña y Google.
    -   Un rol de "administrador" definido por un email específico, que desbloquea todas las capacidades de edición.

6.  **Internacionalización:**
    -   Toda la UI de texto (títulos, botones, etiquetas) está traducida usando \`i18next\`.
    -   Los usuarios pueden cambiar entre inglés y español con un selector de idioma en el encabezado.

**Estilo y Diseño:**
-   **Tema:** Oscuro, elegante y espiritual. La paleta de colores se define en \`globals.css\` usando variables HSL para primario, fondo, tarjeta, etc.
-   **Tipografía:** Se usan fuentes específicas (Alegreya para el cuerpo, Belleza para los titulares) importadas desde Google Fonts.
-   **Layout:** Moderno y responsivo, con un encabezado fijo y un pie de página simple.
-   **Íconos:** Se utiliza Lucide-React para la mayoría de los íconos.

Tu tarea es mantener y extender esta aplicación, asegurando que el código sea limpio, mantenible y siga las mejores prácticas del stack definido.
`;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

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

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <p>{t('loading')}...</p>
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
              <FileTree />
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
            <CardTitle className="flex items-center gap-3">
              <Bot />
              {t('systemPrompt')}
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
