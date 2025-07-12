import { ProfileFormValues } from '@/lib/schemas';
import { UseFormReturn } from 'react-hook-form';

export type ProfileFormHandle = {
  form: UseFormReturn<ProfileFormValues>;
  isLoading: boolean;
  refreshProfile: () => void;
};
