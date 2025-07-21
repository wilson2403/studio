
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
import { Menu, LogOut, ShieldCheck, Users, MessageSquare, FileText } from 'lucide-react';
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
import { getUserProfile } from '@/lib/firebase/firestore';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const navLinks = [
    { href: '/', label: t('navHome') },
    { href: '/ayahuasca', label: t('navAyahuasca') },
    { href: '/#ceremonias', label: t('navCeremonies') },
    { href: '/guides', label: t('navGuides') },
    { href: '/preparation', label: t('navPreparation') },
  ];
  
  const userNavLinks = [
     { href: '/questionnaire', label: t('navQuestionnaire') }
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
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>{t('admin')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{t('userManagement')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/chat')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{t('chatHistory')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-10 w-10" />
            <span className="font-bold font-headline text-lg">
              {t('appName')}
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="sr-only">{t('headerMenuTitle')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <nav className="flex flex-col items-start space-y-4 pt-8 text-lg font-medium">
                  {isAdmin && (
                    <>
                      <SheetClose asChild>
                          <Link href="/admin" className="transition-colors hover:text-primary flex items-center gap-2">
                              <ShieldCheck className="h-5 w-5" />
                              {t('admin')}
                          </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/admin/users" className="transition-colors hover:text-primary flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {t('userManagement')}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/admin/chat" className="transition-colors hover:text-primary flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          {t('chatHistory')}
                        </Link>
                      </SheetClose>
                    </>
                  )}
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
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
                        className="transition-colors hover:text-primary flex items-center gap-2"
                      >
                        <FileText className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto pb-4">
                  <MobileAuthContent />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
