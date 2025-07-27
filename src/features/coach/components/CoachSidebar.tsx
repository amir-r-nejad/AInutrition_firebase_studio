import { Logo } from '@/components/Logo';
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
import { BarChart3, UserCheck, UserPen, Users } from 'lucide-react';
import Link from 'next/link';

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
        <div className='text-xs text-sidebar-foreground/60'>
          Coach Dashboard v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
