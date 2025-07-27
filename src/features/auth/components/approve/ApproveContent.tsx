import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ApproveButton from '@/features/auth/components/approve/ApproveButton';
import { getUser } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import RequestAlreadyProcessedCard from './RequestAlreadyProcessedCard';
import RequestNotFoundCard from './RequestNotFoundCard';
import EmailMismatchCard from './EmailMismatchCard';

async function ApproveContent({
  searchParams,
}: {
  searchParams: Promise<{ token: string; requestId: string; coachId: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const requestId = params.requestId;
  const coachId = params.coachId;

  // Validate required parameters
  if (!token || !requestId || !coachId) {
    return (
      <Card className='w-full max-w-md shadow-xl border-destructive/20'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center'>
              <AlertTriangle className='h-8 w-8 text-destructive' />
            </div>
          </div>
          <CardTitle className='text-xl font-bold text-destructive'>
            Invalid Request Link
          </CardTitle>
          <CardDescription>
            The coaching request link is missing required information or has
            been corrupted.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Please contact your coach to send you a new request link, or check
            that you copied the entire URL correctly.
          </p>
          <Link href='/dashboard'>
            <Button className='w-full'>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const user = await getUser();
  const supabase = await createClient();

  // Fetch the request details with coach information
  const { data: requestData, error: requestError } = await supabase
    .from('coach_client_requests')
    .select('*')
    .eq('approval_token', token)
    .eq('coach_id', coachId)
    .eq('id', requestId)
    .single();

  if (requestError || !requestData) return <RequestNotFoundCard />;

  // Check if request is already processed
  if (requestData.status !== 'pending')
    return <RequestAlreadyProcessedCard status={requestData.status} />;

  // Verify email matches
  if (user.email !== requestData.client_email)
    return (
      <EmailMismatchCard
        requestEmail={requestData.client_email}
        userEmail={user.email!}
      />
    );

  return (
    <CardContent>
      <p className='my-6 text-muted-foreground text-center'>
        Are you sure you want to grant access to your dashboard?
      </p>

      <ApproveButton
        coachId={coachId}
        userId={user.id}
        reqId={requestId}
        token={token}
      />
    </CardContent>
  );
}

export default ApproveContent;
