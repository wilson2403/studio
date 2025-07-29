
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
import { Menu, LogOut, ShieldCheck, User as UserIcon, Palette, History, MessageSquare, Terminal, Hand, Star, Video, Briefcase, BookOpen, Bot, Settings, MessageCircle, StarIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signOut } from '@/lib/firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { Logo } from '../icons/Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { getUserProfile, logUserAction, UserProfile, getNewErrorLogsCount, getContent } from '@/lib/firebase/firestore';
import { EditableTitle } from '../home/EditableTitle';
import EditProfileDialog from '../auth/EditProfileDialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const APP_VERSION = '1.62';

type NavLink = {
    href: string;
    labelKey: string;
    sectionId: string;
    dynamicLabel?: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const previousPathname = usePrevious(pathname);
  const [newErrorCount, setNewErrorCount] = useState(0);
  const [navLinkLabels, setNavLinkLabels] = useState<Record<string, string>>({});


  const navLinks: NavLink[] = [
    { href: '/', labelKey: 'navHome', sectionId: 'home' },
    { href: '/ayahuasca', labelKey: 'navMedicine', sectionId: 'medicine' },
    { href: '/guides', labelKey: 'navGuides', sectionId: 'guides' },
    { href: '/testimonials', labelKey: 'navTestimonials', sectionId: 'testimonials' },
  ];
  
  const userNavLinks: NavLink[] = [
     { href: '/ceremonies', labelKey: 'navCeremonies', sectionId: 'ceremonies' },
     { href: '/artedesanar', labelKey: 'navJourney', sectionId: 'journey' },
     { href: '/preparation', labelKey: 'navPreparation', sectionId: 'preparation' },
  ];

  const adminNavLinks = [
      { href: '/admin', labelKey: 'adminPanel', icon: ShieldCheck },
      { href: '/admin/users', labelKey: 'userManagementTitle', icon: UserIcon },
      { href: '/admin/theme', labelKey: 'themeTab', icon: Palette },
      { href: '/admin/backup', labelKey: 'backupTitle', icon: History },
      { href: '/admin/chats', labelKey: 'chatHistoryTitle', icon: MessageSquare },
      { href: '/admin/logs', labelKey: 'errorLogsTitle', icon: Terminal, id: 'error-logs' },
      { href: '/admin/settings', labelKey: 'systemSettings', icon: Settings }
  ];
  
  const isAdmin = userProfile?.role === 'admin';
  const isOrganizer = userProfile?.role === 'organizer';
  const organizerHasPerms = isOrganizer && (userProfile?.permissions?.canEditCeremonies || userProfile?.permissions?.canEditCourses || userProfile?.permissions?.canEditUsers);

  useEffect(() => {
    const fetchNavLabels = async () => {
        const allLinks = [...navLinks, ...userNavLinks];
        const labels: Record<string, string> = {};
        for (const link of allLinks) {
            const content = await getContent(link.labelKey);
            if (typeof content === 'object' && content !== null) {
                labels[link.labelKey] = content[i18n.language as 'es' | 'en'] || content['es'] || t(link.labelKey);
            } else if (typeof content === 'string') {
                 labels[link.labelKey] = content;
            } else {
                 labels[link.labelKey] = t(link.labelKey);
            }
        }
        setNavLinkLabels(labels);
    };

    fetchNavLabels();
  }, [i18n.language, t]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
        if (isAdmin) {
            const fetchErrorCount = async () => {
                const count = await getNewErrorLogsCount();
                setNewErrorCount(count);
            };

            fetchErrorCount();
            const interval = setInterval(fetchErrorCount, 30000); // Check every 30 seconds

            return () => clearInterval(interval);
        }
    }, [isAdmin]);

  useEffect(() => {
    if (pathname !== previousPathname && user) {
        logUserAction('navigate_to_page', { page: pathname });
    }
  }, [pathname, previousPathname, user]);

  function usePrevious<T>(value: T): T | undefined {
    const ref = React.useRef<T>();
    React.useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleLinkMouseDown = (sectionId: string) => {
    if (userProfile?.role !== 'admin') {
      logUserAction('click_section', { targetId: sectionId });
    }
  }
  
  const getNavLink = (link: NavLink) => {
    const label = navLinkLabels[link.labelKey] || t(link.labelKey);
    return (
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
            {label}
        </Link>
    );
  };
   const getMobileNavLink = (link: NavLink) => {
      const label = navLinkLabels[link.labelKey] || t(link.labelKey);
      return (
        <SheetClose asChild key={link.href}>
          <Link
            href={link.href}
            onMouseDown={() => handleLinkMouseDown(link.sectionId)}
            className="transition-colors hover:text-primary"
          >
            {label}
          </Link>
        </SheetClose>
      );
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
                <span>{t('editProfileTitle')}</span>
            </DropdownMenuItem>
             <DropdownMenuItem onMouseDown={() => router.push('/courses')}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>{t('navCourses')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onMouseDown={() => router.push('/chats')}>
                <Bot className="mr-2 h-4 w-4" />
                <span>{t('myChatsTitle')}</span>
            </DropdownMenuItem>
            {(isAdmin || organizerHasPerms) && (
              <>
                <DropdownMenuSeparator />
                {adminNavLinks.map(link => {
                  let hasAccess = isAdmin;
                  if (!hasAccess && isOrganizer) {
                      if (link.href === '/admin/users' && userProfile.permissions?.canEditUsers) hasAccess = true;
                      if (link.href === '/admin' && (userProfile.permissions?.canEditUsers || userProfile.permissions?.canEditCeremonies || userProfile?.permissions?.canEditCourses)) hasAccess = true;
                      // Other admin links are admin-only
                  }
                  
                  if (!hasAccess && link.href !== '/admin' && link.href !== '/admin/users') return null;
                  
                  if (hasAccess) {
                    return (
                        <DropdownMenuItem key={link.href} onMouseDown={() => router.push(link.href)} className="flex justify-between items-center">
                            <div className='flex items-center'>
                                <link.icon className="mr-2 h-4 w-4" />
                                <span>{t(link.labelKey)}</span>
                            </div>
                            {link.id === 'error-logs' && newErrorCount > 0 && (
                                <Badge variant="destructive_solid" className="h-5">{newErrorCount}</Badge>
                            )}
                            {link.href === '/admin' && <span className="ml-auto text-xs text-muted-foreground">v{APP_VERSION}</span>}
                        </DropdownMenuItem>
                    );
                  }
                  return null;
                })}
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
            {navLinks.map(getNavLink)}
            {user && userNavLinks.map(getNavLink)}
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
                                  <span>{t('editProfileTitle')}</span>
                              </button>
                          </SheetClose>
                          <SheetClose asChild>
                              <Link href="/courses" className="transition-colors hover:text-primary flex items-center gap-2">
                                  <BookOpen className="h-5 w-5" />
                                  {t('navCourses')}
                              </Link>
                          </SheetClose>
                          <SheetClose asChild>
                              <Link href="/chats" className="transition-colors hover:text-primary flex items-center gap-2">
                                  <Bot className="h-5 w-5" />
                                  {t('myChatsTitle')}
                              </Link>
                          </SheetClose>
                        </>
                      )}
                      {(isAdmin || organizerHasPerms) && (
                        <>
                          <DropdownMenuSeparator />
                           {adminNavLinks.map(link => {
                                let hasAccess = isAdmin;
                                if (!hasAccess && isOrganizer) {
                                    if (link.href === '/admin/users' && userProfile.permissions?.canEditUsers) hasAccess = true;
                                    if (link.href === '/admin' && (userProfile.permissions?.canEditUsers || userProfile.permissions?.canEditCeremonies || userProfile?.permissions?.canEditCourses)) hasAccess = true;
                                    // Other admin links are admin-only
                                }
                                if(hasAccess) {
                                    return (
                                        <SheetClose asChild key={link.href}>
                                            <Link href={link.href} className="transition-colors hover:text-primary flex justify-between items-center gap-2 w-full">
                                              <div className='flex items-center gap-2'>
                                                <link.icon className="h-5 w-5" />
                                                <span>{t(link.labelKey)}</span>
                                              </div>
                                                {link.id === 'error-logs' && newErrorCount > 0 && (
                                                  <Badge variant="destructive_solid">{newErrorCount}</Badge>
                                                )}
                                                {link.href === '/admin' && <span className="ml-auto text-xs text-muted-foreground">v{APP_VERSION}</span>}
                                            </Link>
                                        </SheetClose>
                                    )
                                }
                                return null;
                            })}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {navLinks.map(getMobileNavLink)}
                      {user && userNavLinks.map(getMobileNavLink)}
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
