'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SubmitButton from '@/components/ui/SubmitButton';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import { useToast } from '@/hooks/use-toast';
import { userRoles } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const UserRoleSelectionSchema = z.object({
  user_role: z.enum(['client', 'coach'], {
    required_error: 'Please select your role to continue.',
  }),
});

type UserRoleSelectionValues = z.infer<typeof UserRoleSelectionSchema>;

interface UserRoleSelectionProps {
  onRoleSelected: (role: 'client' | 'coach') => void;
}

export function UserRoleSelection({ onRoleSelected }: UserRoleSelectionProps) {
  const { toast } = useToast();

  const form = useForm<UserRoleSelectionValues>({
    resolver: zodResolver(UserRoleSelectionSchema),
    defaultValues: {
      user_role: undefined,
    },
  });

  async function handleSubmit(data: UserRoleSelectionValues) {
    try {
      // TODO: Save user role to database
      console.log('Selected user role:', data.user_role);

      await editProfile({ user_role: data.user_role });

      toast({
        title: 'Role Selected',
        description: `Welcome ${
          data.user_role === 'coach' ? 'Coach' : 'to NutriPlan'
        }!`,
      });

      onRoleSelected(data.user_role);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className='w-full max-w-2xl shadow-xl'>
      <CardHeader className='text-center'>
        <div className='flex justify-center items-center mb-4'>
          <Leaf className='h-10 w-10 text-primary' />
        </div>
        <CardTitle className='text-2xl font-bold'>
          Welcome to NutriPlan!
        </CardTitle>
        <CardDescription>
          Let&apos;s personalize your experience. Please select your role to get
          started.
        </CardDescription>
        <Progress value={20} className='w-full mt-4' />
        <p className='text-sm text-muted-foreground mt-1'>Step 1 of 5</p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-8'
          >
            <div className='text-center p-4 space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-xl font-semibold text-primary'>
                  Choose Your Role
                </h3>
                <p className='text-muted-foreground'>
                  This helps us customize your experience and available
                  features.
                </p>
              </div>

              <div className='max-w-md mx-auto'>
                <FormField
                  control={form.control}
                  name='user_role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-lg font-medium'>
                        I am joining as a...
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='h-12 text-base'>
                            <SelectValue placeholder='Select your role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem
                              key={role.value}
                              value={role.value}
                              className='py-3'
                            >
                              <div className='flex items-center gap-3'>
                                <UserCheck className='h-4 w-4 text-primary' />
                                <div className='text-left'>
                                  <div className='font-medium'>
                                    {role.label.split(' - ')[0]}
                                  </div>
                                  <div className='text-sm text-muted-foreground'>
                                    {role.label.split(' - ')[1]}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground'>
                <p className='font-medium mb-2'>What happens next?</p>
                <div className='space-y-1 text-left'>
                  <p>
                    • <strong>Clients:</strong> Set up your health profile and
                    nutrition goals
                  </p>
                  <p>
                    • <strong>Coaches:</strong> Create your professional profile
                    and credentials
                  </p>
                </div>
              </div>
            </div>

            <div className='flex justify-end pt-6'>
              <SubmitButton
                isLoading={form.formState.isSubmitting}
                loadingLabel='Saving...'
                label='Continue'
                className='min-w-32'
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
