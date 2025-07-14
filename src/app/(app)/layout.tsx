'use client';

import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import {
  Bot,
  BrainCircuit,
  ChefHat,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  NotebookText,
  SplitSquareHorizontal,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { section: 'Tools & Planning' },
  {
    href: '/tools/smart-calorie-planner',
    label: 'Smart Calorie Planner',
    icon: BrainCircuit,
  },
  {
    href: '/tools/macro-splitter',
    label: 'Macro Splitter',
    icon: SplitSquareHorizontal,
  },
  { href: '/tools/meal-suggestions', label: 'Meal Suggestions', icon: ChefHat },
  { section: 'Meal Management' },
  {
    href: '/meal-plan/current',
    label: 'Current Meal Plan',
    icon: NotebookText,
  },
  { href: '/meal-plan/optimized', label: 'AI Meal Plan', icon: Bot },
  { section: 'Support' },
  { href: '/support/faq', label: 'FAQ & Chatbot', icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: currentUser, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
        <p className='ml-2'>Redirecting...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => {
              if (item.section) {
                return (
                  <React.Fragment key={`separator-${index}`}>
                    {index !== 0 && <SidebarSeparator className='my-2' />}
                  </React.Fragment>
                );
              } else {
                if (!item.href || !item.icon) {
                  return null;
                }
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.href} passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <div>
                          <IconComponent className='h-5 w-5' />
                          <span>{item.label}</span>
                        </div>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              }
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className='p-2'>
          <div className='flex items-center gap-3 p-2 rounded-md border border-sidebar-border bg-sidebar-accent/50'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src={`https://placehold.co/100x100.png?text=${
                  currentUser.email?.[0]?.toUpperCase() ?? 'U'
                }`}
                alt={currentUser.email ?? 'User Avatar'}
                data-ai-hint='avatar person'
              />
              <AvatarFallback>
                {currentUser.email?.[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col group-data-[collapsible=icon]:hidden'>
              <span className='text-sm font-medium text-sidebar-foreground truncate max-w-[120px]'>
                {currentUser.email}
              </span>
            </div>
          </div>
          <SidebarMenuButton
            onClick={signOut}
            tooltip='Logout'
            className='w-full'
          >
            <LogOut className='h-5 w-5' />
            <span>Logout</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4'>
          <SidebarTrigger className='sm:hidden' />
        </header>
        <main className='flex-1 p-4 md:p-6 overflow-auto'>{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}