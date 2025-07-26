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

function RequestNotFoundCard() {
  return (
    <Card className='w-full max-w-md shadow-xl border-destructive/20'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
        </div>
        <CardTitle className='text-xl font-bold text-destructive'>
          Request Not Found
        </CardTitle>
        <CardDescription>
          This coaching request could not be found or has expired.
        </CardDescription>
      </CardHeader>
      <CardContent className='text-center space-y-4'>
        <p className='text-sm text-muted-foreground'>
          The request may have been withdrawn, expired, or the link may be
          invalid.
        </p>
        <Link href='/dashboard'>
          <Button className='w-full'>Go to Dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default RequestNotFoundCard;
