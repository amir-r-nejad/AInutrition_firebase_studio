'use client';

import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // This page is a placeholder.
  // The redirect logic is handled in the AuthProvider in the root layout.
  // We render a loading state here to prevent Next.js from rendering a 404
  // while the client-side AuthProvider logic is booting up.
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <Loader2 className='h-12 w-12 animate-spin text-primary' />
      <p className='ml-4 text-lg'>Loading...</p>
    </div>
  );
}
