'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { signoutAction } from '../../actions/signout';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import Spinner from '@/components/ui/Spinner';

function SignoutButton() {
  const [isSigninout, startSignout] = useTransition();

  async function handleSignout() {
    startSignout(async () => {
      await signoutAction();
    });
  }

  return (
    <SidebarMenuButton
      onClick={handleSignout}
      disabled={isSigninout}
      tooltip='Logout'
      className='w-full'
    >
      {isSigninout && (
        <>
          <Spinner />
          <span>Signinout...</span>
        </>
      )}

      {!isSigninout && (
        <>
          <LogOut className='h-5 w-5' />
          <span>Logout</span>
        </>
      )}
    </SidebarMenuButton>
  );
}

export default SignoutButton;
