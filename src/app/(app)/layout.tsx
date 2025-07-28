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
import SignoutButton from '@/features/auth/components/signup/SignoutButton';
import { createClient } from '@/lib/supabase/server';
import {
  Bot,
  BrainCircuit,
  ChefHat,
  HelpCircle,
  LayoutDashboard,
  MessageSquareQuote,
  NotebookText,
  SplitSquareHorizontal,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import {
  Calculator,
  CircleUser,
  Dumbbell,
  House,
  MessageCircle,
  PieChart,
  Target,
  Utensils,
} from 'lucide-react';

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
  { section: 'Exercise Planning' },
  { href: '/tools/workout-planner', label: 'AI Exercise Planner', icon: Dumbbell },
  { section: 'Support' },
  {
    href: '/support/chatbot',
    label: 'Chatbot Support',
    icon: MessageSquareQuote,
  },
  { href: '/support/faq', label: 'FAQ & Chatbot', icon: HelpCircle },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (error) redirect('/error');

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
                    {/* Removed the label for section as it's just a separator now based on previous styling */}
                  </React.Fragment>
                );
              }
              const IconComponent = item.icon; // Get the icon component
              return (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href!} passHref>
                    <SidebarMenuButton
                      isActive={false} // This needs to be dynamic based on current path
                      tooltip={item.label}
                    >
                      <IconComponent className='h-5 w-5' />{' '}
                      {/* Render the icon component */}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className='p-2'>
          <div className='flex items-center gap-3 p-2 rounded-md border border-sidebar-border bg-sidebar-accent/50'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src={
                  user?.user_metadata.picture
                    ? user?.user_metadata.picture
                    : `https://placehold.co/100x100.png?text=${
                        user.email?.[0]?.toUpperCase() ?? 'U'
                      }`
                }
                alt={user.email ?? 'User Avatar'}
                data-ai-hint='avatar person'
              />
              <AvatarFallback>
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col group-data-[collapsible=icon]:hidden'>
              <span className='text-sm font-medium text-sidebar-foreground truncate max-w-[120px]'>
                {user.email}
              </span>
            </div>
          </div>
          <SignoutButton />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4'>
          <SidebarTrigger className='sm:hidden' />
        </header>
        <main className='flex-1 p-4 md:p-6 overflow-auto min-h-dvh'>
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}