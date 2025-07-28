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
import { BarChart3, UserCheck, UserPen, Users } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const coachMenuItems = [
  {
    title: 'Dashboard',
    url: '/coach-dashboard',
    icon: BarChart3,
  },
  {
    title: 'My Clients',
    url: '/coach-dashboard/clients',
    icon: UserCheck,
  },
  {
    title: 'Client Requests',
    url: '/coach-dashboard/requests',
    icon: Users,
  },
  {
    title: 'Your Profile',
    url: '/coach-dashboard/profile',
    icon: UserPen,
  },
];

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

      <SidebarFooter className='border-t border-sidebar-border p-4'>
        <Suspense fallback={<Skeleton className='w-10 h-10 rounded-full' />}>
          <CoachSidebarProfile />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

async function CoachSidebarProfile() {
  const coach = await getUser();

  return (
    <div className='text-sm text-sidebar-foreground/60 flex items-center gap-2'>
      <Avatar>
        <AvatarImage src={coach.user_metadata.avatar_url} />
        <AvatarFallback></AvatarFallback>
      </Avatar>
      {coach.user_metadata.full_name.split('').slice(0, 20)}
    </div>
  );
}
