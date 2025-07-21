'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { signoutAction } from '../../actions/signout';
import { LogOut } from 'lucide-react';

function SignoutButton() {
  return (
    <SidebarMenuButton
      onClick={signoutAction}
      tooltip='Logout'
      className='w-full'
    >
      <LogOut className='h-5 w-5' />
      <span>Logout</span>
    </SidebarMenuButton>
  );
}

export default SignoutButton;
