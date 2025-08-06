import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser } from '@/lib/supabase/data-service';
import Link from 'next/link';
import { Suspense } from 'react';
import { coachMenuItems } from '../lib/constant';
import SignoutButton from '@/features/auth/components/signup/SignoutButton';

export function CoachSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className='border-b border-sidebar-border p-4'>
        <div className='flex items-center gap-2'>
          <Logo />
          <div className='flex flex-col'>
            <span className='text-sm font-semibold text-sidebar-foreground'>
              NutriPlan
            </span>
            <span className='text-xs text-sidebar-foreground/70'>
              Coach Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Coach Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coachMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className='flex items-center gap-3'>
                      <item.icon className='h-4 w-4' />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-2'>
        <Suspense fallback={<Skeleton className='w-10 h-10 rounded-full' />}>
          <CoachSidebarProfile />
        </Suspense>
        <SignoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}

async function CoachSidebarProfile() {
  const coach = await getUser();

  return (
    <div className='flex items-center gap-3 p-2 rounded-md border border-sidebar-border bg-sidebar-accent/50'>
      <Avatar className='h-9 w-9'>
        <AvatarImage
          src={
            coach?.user_metadata.picture
              ? coach?.user_metadata.picture
              : `https://placehold.co/100x100.png?text=${
                  coach.email?.[0]?.toUpperCase() ?? 'U'
                }`
          }
          alt={coach.email ?? 'User Avatar'}
          data-ai-hint='avatar person'
        />
        <AvatarFallback>
          {coach.email?.[0]?.toUpperCase() ?? 'U'}
        </AvatarFallback>
      </Avatar>
      <div className='flex flex-col group-data-[collapsible=icon]:hidden'>
        <span className='text-sm font-medium text-sidebar-foreground truncate max-w-[120px]'>
          {coach.email}
        </span>
      </div>
    </div>
  );
}
