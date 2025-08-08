
import { getUserProfile } from '@/lib/supabase/data-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const profile = await getUserProfile();
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
