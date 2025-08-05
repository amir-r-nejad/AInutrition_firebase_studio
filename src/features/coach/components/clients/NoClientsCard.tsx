import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, User } from 'lucide-react';
import Link from 'next/link';

function NoClientsCard() {
  return (
    <Card className='border border-border/50'>
      <CardContent className='p-12 text-center flex flex-col space-y-6'>
        <div className='p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center'>
          <User className='h-8 w-8 text-muted-foreground' />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>
            No clients found
          </h3>
          <p className='text-muted-foreground'>
            Try adjusting your filters or search criteria to find clients.
          </p>
        </div>
        <Link href='/coach-dashboard/requests'>
          <Button className='gap-2'>
            <ExternalLink className='h-4 w-4' />
            Find New Clients
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default NoClientsCard;
