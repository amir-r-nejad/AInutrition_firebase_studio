import { getProfileById, getUserDataById } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';

export async function getCoachClients() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: clients, error: reqError } = await supabase
      .from('coach_clients')
      .select('client_id')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (reqError)
      throw new Error(
        `Unable to retrieve client list. Please try again later. Error: ${reqError.message}`
      );

    const clientsProfile = await Promise.all(
      clients.map(async (client) => {
        const profile = await getProfileById(
          client.client_id,
          'client',
          'user_id, age, biological_sex, primary_diet_goal, created_at'
        );
        const userData = await getUserDataById(client.client_id);

        return { ...(profile as any), ...userData.user_metadata };
      })
    );

    return clientsProfile;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getCoachProfile() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select(
        'user_id, certification, joined_date, description, years_experience'
      )
      .eq('user_id', user.id)
      .single();

    if (coachError || !coach)
      throw new Error(
        `Unable to retrieve coach profile. Please try again later. Error: ${coachError.message}`
      );

    const profile = await getProfileById(
      coach.user_id,
      'coach',
      'user_id, age, biological_sex'
    );
    const userData = await getUserDataById(coach.user_id);

    return { ...userData.user_metadata, ...(profile as any), ...coach };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getRecentCoachClientRequests(limit: number = 5) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: requests, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('status, requested_at, client_email, id')
      .eq('coach_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (reqError)
      throw new Error(
        `Unable to retrieve recent requests. Please try again later. Error: ${reqError.message}`
      );

    return requests;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getPendingClientRequests() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: requests, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('status, requested_at, client_email, id')
      .eq('coach_id', user.id)
      .eq('status', 'pending');

    if (reqError)
      throw new Error(
        `Unable to retrieve pending requests. Please try again later. Error: ${reqError.message}`
      );

    return requests;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getAllClientRequests() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: requests, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('status, requested_at, client_email, id')
      .eq('coach_id', user.id);

    if (reqError)
      throw new Error(
        `Unable to retrieve all requests. Please try again later. Error: ${reqError.message}`
      );

    return requests;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getAcceptedClientRequests() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      throw new Error('Authentication failed. Please log in again.');

    const { data: requests, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('status, requested_at, client_email, id')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (reqError)
      throw new Error(
        `Unable to retrieve accepted requests. Please try again later. Error: ${reqError.message}`
      );

    return requests;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
