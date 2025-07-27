import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import Link from 'next/link';

function RequestAlreadyProcessedCard({ status }: { status: string }) {
  return (
    <Card className='w-full max-w-md shadow-xl border-amber-200'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <div className='h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center'>
            <UserCheck className='h-8 w-8 text-amber-600' />
          </div>
        </div>
        <CardTitle className='text-xl font-bold text-amber-800'>
          Request Already {status === 'accepted' ? 'Accepted' : 'Processed'}
        </CardTitle>
        <CardDescription>
          You have already {status} this coaching request.
        </CardDescription>
      </CardHeader>
      <CardContent className='text-center space-y-4'>
        <p className='text-sm text-muted-foreground'>
          {status === 'accepted'
            ? 'Your coaching relationship is now active. You can access your nutrition tools from the dashboard.'
            : 'This request has been declined and cannot be modified.'}
        </p>
        <Link href='/dashboard'>
          <Button className='w-full'>Go to Dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default RequestAlreadyProcessedCard;
