import { useToast } from '@/hooks/use-toast';
import { ProfileFormValues } from '@/lib/schemas';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { getProfileData } from '@/app/api/user/database';

export function useProfileData(
  userId: string | undefined,
  form: UseFormReturn<ProfileFormValues>
) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  function refreshProfile() {
    if (userId) {
      setIsLoading(true);
      getProfileData(userId)
        .then((profileDataSubset) => {
          form.reset(profileDataSubset);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading profile data:', error);
          toast({
            title: 'Error',
            description: 'Could not load profile data.',
            variant: 'destructive',
          });
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }

  return { isLoading, refreshProfile };
}
