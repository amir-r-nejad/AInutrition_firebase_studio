import type React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CoachSidebar } from '@/features/coach/components/CoachSidebar';
import { Toaster } from '@/components/ui/toaster';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <CoachSidebar />
        <main className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6'>{children}</div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
