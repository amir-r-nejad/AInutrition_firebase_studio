import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Progress } from '@/components/ui/progress';
import {
  getProfileById,
  getUserDataById,
  getUserPlan,
} from '@/lib/supabase/data-service';
import { calculateProgress, formatValue } from '@/lib/utils';
import { Activity, Calendar, Target, TrendingUp, User } from 'lucide-react';
import CoachClientQuickActions from './CoachClientQuickActions';

interface CoachClientDashboardProps {
  clientId: string;
}

export async function CoachClientDashboard({
  clientId,
}: CoachClientDashboardProps) {
  try {
    const profile = await getProfileById(clientId, 'client');
    const userData = await getUserDataById(clientId);
    const plan = await getUserPlan(clientId);

    return (
      <div className='space-y-6'>
        {/* Client Info Header */}
        <Card className='border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5'>
          <CardHeader>
            <CardTitle className='text-xl flex items-center gap-2 text-primary'>
              <User className='h-5 w-5' />
              Client:{' '}
              {userData.user_metadata?.full_name ||
                userData?.email ||
                'Unknown'}
            </CardTitle>
            <CardDescription>
              Monitoring nutrition progress and meal planning
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Stats Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Current Weight
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                {formatValue(profile?.current_weight_kg, ' kg')}
              </div>
              <p className='text-xs text-muted-foreground'>
                Target: {formatValue(profile?.target_weight_1month_kg, ' kg')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Daily Calories
              </CardTitle>
              <Target className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                {formatValue(plan?.target_daily_calories, ' kcal')}
              </div>
              <p className='text-xs text-muted-foreground'>
                TDEE: {formatValue(plan?.maintenance_calories_tdee, ' kcal')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Body Fat %</CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                {formatValue(profile?.bf_current, '%')}
              </div>
              <p className='text-xs text-muted-foreground'>
                Target: {formatValue(profile?.bf_target, '%')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Activity Level
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                {profile?.physical_activity_level || 'Not set'}
              </div>
              <p className='text-xs text-muted-foreground'>
                Goal: {profile?.primary_diet_goal || 'Not set'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-primary'>Weight Progress</CardTitle>
              <CardDescription>Progress towards 1-month goal</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>
                    Current: {formatValue(profile?.current_weight_kg, ' kg')}
                  </span>
                  <span>
                    Target:{' '}
                    {formatValue(profile?.target_weight_1month_kg, ' kg')}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(
                    profile?.current_weight_kg,
                    profile?.target_weight_1month_kg
                  )}
                  className='h-2'
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                Long-term goal:{' '}
                {formatValue(profile?.long_term_goal_weight_kg, ' kg')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-primary'>Body Composition</CardTitle>
              <CardDescription>
                Body fat and muscle mass targets
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Body Fat</span>
                  <span>
                    {formatValue(profile?.bf_current, '%')} /{' '}
                    {formatValue(profile?.bf_target, '%')}
                  </span>
                </div>
                <Progress
                  value={
                    profile?.bf_current && profile?.bf_target
                      ? Math.max(
                          0,
                          100 - (profile.bf_current / profile.bf_target) * 100
                        )
                      : 0
                  }
                  className='h-2'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Muscle Mass</span>
                  <span>
                    {formatValue(profile?.mm_current, '%')} /{' '}
                    {formatValue(profile?.mm_target, '%')}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(
                    profile?.mm_current,
                    profile?.mm_target
                  )}
                  className='h-2'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Macronutrient Targets */}
        <Card>
          <CardHeader>
            <CardTitle className='text-primary'>
              Daily Macronutrient Targets
            </CardTitle>
            <CardDescription>
              Client&apos;s personalized macro breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 lg:grid-cols-3'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Protein</span>
                  <span>
                    {formatValue(plan?.target_protein_g?.toFixed(2), 'g')} (
                    {formatValue(
                      plan?.target_protein_percentage?.toFixed(2),
                      '%'
                    )}
                    )
                  </span>
                </div>
                <Progress
                  value={plan?.target_protein_percentage || 0}
                  className='h-2'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Carbohydrates</span>
                  <span>
                    {formatValue(plan?.target_carbs_g?.toFixed(2), 'g')} (
                    {formatValue(
                      plan?.target_carbs_percentage?.toFixed(2),
                      '%'
                    )}
                    )
                  </span>
                </div>
                <Progress
                  value={plan?.target_carbs_percentage || 0}
                  className='h-2'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Fat</span>
                  <span>
                    {formatValue(plan?.target_fat_g?.toFixed(2), 'g')} (
                    {formatValue(plan?.target_fat_percentage?.toFixed(2), '%')})
                  </span>
                </div>
                <Progress
                  value={plan?.target_fat_percentage || 0}
                  className='h-2'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Actions */}
        <Card>
          <CardHeader>
            <CardTitle className='text-primary'>Coach Actions</CardTitle>
            <CardDescription>
              Access client&apos;s detailed information and meal plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoachClientQuickActions clientId={clientId} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Client Data Unavailable'
        message={
          error?.message ||
          "We couldn't load this client's data. Please ensure you have access to this client."
        }
      />
    );
  }
}
