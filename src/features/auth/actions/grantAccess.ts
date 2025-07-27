'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type GrantAccessResult = {
  success: boolean;
  error?: string;
};

export async function grantAccessAction(
  userId: string,
  coachId: string,
  requestId: string,
  token: string
): Promise<GrantAccessResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return {
        success: false,
        error: 'Authentication failed. Please log in and try again.',
      };

    if (user.id !== userId)
      return {
        success: false,
        error:
          'Unauthorized access. You can only approve requests for your own account.',
      };

    // Validate the request exists and matches all parameters
    const { data: request, error: reqError } = await supabase
      .from('coach_client_requests')
      .select('id, status, client_email')
      .eq('approval_token', token)
      .eq('coach_id', coachId)
      .eq('id', requestId)
      .single();

    if (reqError) {
      if (reqError.code === 'PGRST116') {
        return {
          success: false,
          error:
            'Invalid or expired request link. The request may have been removed or the link is corrupted.',
        };
      }

      return {
        success: false,
        error: `Failed to validate request: ${reqError.message}`,
      };
    }

    if (!request)
      return {
        success: false,
        error: 'Request not found. The link may be invalid or expired.',
      };

    // Check if request is already processed
    if (request.status !== 'pending')
      return {
        success: false,
        error: `This request has already been ${request.status}. You cannot modify it further.`,
      };

    // Verify the user's email matches the request
    if (user.email !== request.client_email)
      return {
        success: false,
        error:
          'Email mismatch. This request was sent to a different email address.',
      };

    // Check if client already has a relationship with any coach
    const { data: existingRelationship, error: relationshipError } =
      await supabase
        .from('coach_clients')
        .select('id, coach_id')
        .eq('client_id', user.id)
        .limit(1);

    if (relationshipError)
      return {
        success: false,
        error: `Failed to check existing relationships: ${relationshipError.message}`,
      };

    if (existingRelationship && existingRelationship.length > 0)
      return {
        success: false,
        error:
          'You already have an active coaching relationship. Please contact support if you need to change coaches.',
      };

    const { data: duplicateRequest, error: duplicateError } = await supabase
      .from('coach_client_requests')
      .select('id, status')
      .eq('coach_id', coachId)
      .eq('client_email', user.email)
      .neq('id', requestId)
      .in('status', ['pending', 'accepted']);

    if (duplicateError)
      return {
        success: false,
        error: `Failed to check for duplicate requests: ${duplicateError.message}`,
      };

    if (duplicateRequest && duplicateRequest.length > 0)
      return {
        success: false,
        error:
          'You already have a pending or accepted request with this coach.',
      };

    const { error: updateRequestError } = await supabase
      .from('coach_client_requests')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        response_message: 'Request accepted by client',
      })
      .eq('id', requestId);

    if (updateRequestError)
      return {
        success: false,
        error: `Failed to update request status: ${updateRequestError.message}`,
      };

    // 2. Create the coach-client relationship
    const { error: relationshipCreateError } = await supabase
      .from('coach_clients')
      .insert({
        coach_id: coachId,
        client_id: user.id,
        status: 'accepted',
        requested_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      });

    if (relationshipCreateError) {
      await supabase
        .from('coach_client_requests')
        .update({
          status: 'pending',
          responded_at: null,
          response_message: null,
        })
        .eq('id', requestId);

      return {
        success: false,
        error: `Failed to create coaching relationship: ${relationshipCreateError.message}`,
      };
    }

    revalidatePath('/dashboard');
    revalidatePath('/coach-dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('grantAccessAction error:', error);
    return {
      success: false,
      error:
        error?.message ||
        'An unexpected error occurred while processing your request.',
    };
  }
}
