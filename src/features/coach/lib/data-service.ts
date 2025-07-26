import { createClient } from '@/lib/supabase/server';

export async function getCoachClientRequests() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error(`Auth error: ${authError?.message}`);

    const { data: requests, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('status, requested_at, client_email, id')
      .eq('coach_id', user.id);

    if (reqError) throw new Error(`Fail to fetch Requests ${reqError.message}`);

    return requests;
  } catch (error) {
    console.log(error);
  }
}
