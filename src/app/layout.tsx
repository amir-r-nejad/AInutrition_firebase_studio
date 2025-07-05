import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { isConfigured } from '@/lib/firebase/firebase';
import FirebaseInitError from '@/components/FirebaseInitError';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NutriPlan',
  description: 'Your personalized nutrition and meal planning assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If Firebase is not configured, show a dedicated error page.
  // This prevents the app from crashing with a cryptic error.
  if (!isConfigured) {
    return (
      <html lang='en'>
        <body className={`${inter.variable} antialiased`}>
          <FirebaseInitError />
        </body>
      </html>
    );
  }

  return (
    <html lang='en'>
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
