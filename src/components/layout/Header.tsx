
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, ShieldCheck, User as UserIcon, Palette, History, MessageSquare, Terminal, Hand, Star, Video, Briefcase, BookOpen } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signOut } from '@/lib/firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { Logo } from '../icons/Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { getUserProfile, logSectionClick, updateVideoProgress } from '@/lib/firebase/firestore';
import { EditableTitle } from '../home/EditableTitle';
import EditProfileDialog from '../auth/EditProfileDialog';
import { ScrollArea } from '../ui/scroll-area';

const ADMIN_EMAIL = 'wilson2403@gmail.com';
const APP_VERSION = '1.23';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { href: '/', label: t('navHome'), sectionId: 'home' },
    { href: '/ayahuasca', label: "Medicina", sectionId: 'medicine' },
    { href: '/guides', label: t('navGuides'), sectionId: 'guides' },
  ];
  
  const userNavLinks = [
     { href: '/ceremonies', label: "Ceremonias", sectionId: 'ceremonies' },
     { href: '/preparation', label: t('navPreparation'), sectionId: 'preparation' },
     { href: '/questionnaire', label: t('navQuestionnaire'), sectionId: 'questionnaire' }
  ];

  const adminNavLinks = [
      { href: '/admin', label: t('adminPanel'), icon: ShieldCheck },
      { href: '/admin/users', label: t('usersTab'), icon: UserIcon },
      { href: '/admin/theme', label: t('Tema'), icon: Palette },
      { href: '/admin/backup', label: t('backupTab'), icon: History },
      { href: '/admin/chat', label: t('chatHistory'), icon: MessageSquare },
      { href: '/admin/logs', label: t('errorLogs'), icon: Terminal }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setIsAdmin(!!profile?.isAdmin || currentUser.email === ADMIN_EMAIL);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleLinkMouseDown = (sectionId: string) => {
    if (!isAdmin) {
      logSectionClick(sectionId, user?.uid);
    }
  }

  const AuthContent = () => {
    if (loading) {
      return <Skeleton className="h-10 w-24" />;
    }
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full mr-2"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={user.displayName || 'Avatar'}
                />
                <AvatarFallback>
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Editar Perfil</span>
            </DropdownMenuItem>
             <DropdownMenuItem onMouseDown={() => router.push('/my-ceremonies')}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>{t('myCeremoniesTitle')}</span>
            </DropdownMenuItem>
             <DropdownMenuItem onMouseDown={() => router.push('/courses')}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>{t('navCourses')}</span>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                {adminNavLinks.map(link => (
                    <DropdownMenuItem key={link.href} onMouseDown={() => router.push(link.href)}>
                        <link.icon className="mr-2 h-4 w-4" />
                        <span>{link.label}</span>
                        {link.href === '/admin' && <span className="ml-auto text-xs text-muted-foreground">v{APP_VERSION}</span>}
                    </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('signOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button asChild>
        <Link href="/login">{t('signIn')}</Link>
      </Button>
    );
  };

  const MobileAuthContent = () => {
    if (loading) {
      return <Skeleton className="h-10 w-full" />;
    }
    if (user) {
      return (
        <Button onClick={handleSignOut} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          {t('signOut')}
        </Button>
      );
    }
    return (
      <SheetClose asChild>
        <Button asChild className="w-full">
          <Link href="/login">{t('signIn')}</Link>
        </Button>
      </SheetClose>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2" onMouseDown={() => handleLinkMouseDown('home')}>
              <Logo className="h-10 w-10" />
              <span className="font-bold font-headline text-lg">
                  <EditableTitle
                      tag="p"
                      id="appName"
                      initialValue={t('appName')}
                  />
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseDown={() => handleLinkMouseDown(link.sectionId)}
                className={cn(
                  'transition-colors hover:text-primary',
                  (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && link.href.length > 1))
                    ? 'text-primary'
                    : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && userNavLinks.map((link) => (
               <Link
                key={link.href}
                href={link.href}
                onMouseDown={() => handleLinkMouseDown(link.sectionId)}
                className={cn(
                  'transition-colors hover:text-primary',
                  (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && link.href.length > 1))
                    ? 'text-primary'
                    : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div className="hidden md:flex items-center">
              <AuthContent />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col">
                <SheetHeader>
                   <SheetTitle className="sr-only">{t('headerMenuTitle')}</SheetTitle>
                   {user && (
                    <div className="flex items-center gap-4 border-b pb-4">
                       <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={user.photoURL || undefined}
                            alt={user.displayName || 'Avatar'}
                          />
                          <AvatarFallback>
                            {user.displayName
                              ? user.displayName.charAt(0).toUpperCase()
                              : user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-md font-medium leading-none">
                            {user.displayName}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                    </div>
                   )}
                </SheetHeader>
                <ScrollArea className="flex-1 -mr-6">
                  <div className="pr-6">
                    <nav className="flex flex-col items-start space-y-4 pt-8 text-lg font-medium">
                      {user && (
                        <>
                          <SheetClose asChild>
                              <button onClick={() => setIsProfileDialogOpen(true)} className="transition-colors hover:text-primary flex items-center gap-2">
                                  <UserIcon className="h-5 w-5" />
                                  <span>Editar Perfil</span>
                              </button>
                          </SheetClose>
                           <SheetClose asChild>
                              <Link href="/my-ceremonies" className="transition-colors hover:text-primary flex items-center gap-2">
                                  <Briefcase className="h-5 w-5" />
                                  {t('myCeremoniesTitle')}
                              </Link>
                          </SheetClose>
                          <SheetClose asChild>
                              <Link href="/courses" className="transition-colors hover:text-primary flex items-center gap-2">
                                  <BookOpen className="h-5 w-5" />
                                  {t('navCourses')}
                              </Link>
                          </SheetClose>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          {adminNavLinks.map((link) => (
                              <SheetClose asChild key={link.href}>
                                  <Link href={link.href} className="transition-colors hover:text-primary flex items-center gap-2 w-full">
                                      <link.icon className="h-5 w-5" />
                                      <span>{link.label}</span>
                                      {link.href === '/admin' && <span className="ml-auto text-xs text-muted-foreground">v{APP_VERSION}</span>}
                                  </Link>
                              </SheetClose>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            onMouseDown={() => handleLinkMouseDown(link.sectionId)}
                            className="transition-colors hover:text-primary"
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                      {user && userNavLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            onMouseDown={() => handleLinkMouseDown(link.sectionId)}
                            className="transition-colors hover:text-primary"
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>
                </ScrollArea>
                <div className="mt-auto pb-4">
                  <MobileAuthContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <EditProfileDialog
          user={user}
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
      />
    </>
  );
}
