import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function EmailMismatchCard({
  requestEmail,
  userEmail,
}: {
  requestEmail: string;
  userEmail: string;
}) {
  return (
    <Card className='w-full max-w-md shadow-xl border-destructive/20'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
        </div>
        <CardTitle className='text-xl font-bold text-destructive'>
          Email Mismatch
        </CardTitle>
        <CardDescription>
          This request was sent to a different email address.
        </CardDescription>
      </CardHeader>
      <CardContent className='text-center space-y-4'>
        <div className='p-3 bg-muted rounded-md text-sm'>
          <p>
            <strong>Request sent to:</strong> {requestEmail}
          </p>
          <p>
            <strong>Your current email:</strong> {userEmail}
          </p>
        </div>
        <p className='text-sm text-muted-foreground'>
          Please log in with the correct email address or contact your coach for
          a new request.
        </p>
        <Link href='/dashboard'>
          <Button className='w-full'>Go to Dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default EmailMismatchCard;
