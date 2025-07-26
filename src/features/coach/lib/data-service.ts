import { getProfileById, getUserDataById } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';

export async function getCoachClients() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error(`Auth error: ${authError?.message}`);

    const { data: clients, error: reqError } = await supabase
      .from('coach_clients')
      .select('client_id')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (reqError || !clients)
      throw new Error(`Fail to fetch clients ${reqError.message}`);

    const clientsProfile = await Promise.all(
      clients.map(async (client) => {
        const profile = await getProfileById(
          client.client_id,
          'client',
          'user_id, age, biological_sex, primary_diet_goal, created_at'
        );
        const userData = await getUserDataById(client.client_id);

        return { ...(profile as any), ...userData };
      })
    );

    return clientsProfile;
  } catch (error) {
    console.log(error);
  }
}

export async function getCoachProfile() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error(`Auth error: ${authError?.message}`);

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select(
        'user_id, certification, joined_date, description, years_experience'
      )
      .eq('user_id', user.id)
      .single();

    if (!coach || coachError) throw new Error();

    const profile = await getProfileById(
      coach.user_id,
      'coach',
      'user_id, age, biological_sex'
    );
    const userData = await getUserDataById(coach.user_id);

    return { ...userData, ...(profile as any), ...coach };
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentCoachClientRequests(limit: number = 5) {
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
      .eq('coach_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (reqError)
      throw new Error(`Fail to fetch recent requests: ${reqError.message}`);

    return requests;
  } catch (error) {
    console.log(error);
  }
}

export async function getPendingClientRequests() {
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
      .eq('coach_id', user.id)
      .eq('status', 'pending');

    if (reqError)
      throw new Error(`Failed to fetch pending requests: ${reqError.message}`);

    return requests;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllClientRequests() {
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

    if (reqError)
      throw new Error(`Failed to fetch all requests: ${reqError.message}`);

    return requests;
  } catch (error) {
    console.log(error);
  }
}

export async function getAcceptedClientRequests() {
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
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (reqError)
      throw new Error(`Failed to fetch accepted requests: ${reqError.message}`);

    return requests;
  } catch (error) {
    console.log(error);
  }
}
