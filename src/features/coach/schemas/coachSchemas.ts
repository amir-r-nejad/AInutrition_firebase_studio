import { z } from 'zod';

export const CoachProfileFormSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(18, 'Age must be at least 18')
    .max(100, 'Age must be less than 100'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  certification: z
    .array(z.string())
    .min(1, 'Certification is required')
    .max(200, 'Certification must be less than 200 characters'),
  years_experience: z
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience must be less than 50'),
});

export type CoachProfileFormValues = z.infer<typeof CoachProfileFormSchema>;

export const CoachOnboardingFormSchema = z.object({
  user_role: z.enum(['coach'], {
    required_error: 'User role must be coach.',
  }),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(18, 'Age must be at least 18')
    .max(100, 'Age must be less than 100'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  certification: z
    .array(z.string())
    .min(1, 'Certification is required')
    .max(200, 'Certification must be less than 200 characters'),
  years_experience: z
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience must be less than 50'),
});

export type CoachOnboardingFormValues = z.infer<
  typeof CoachOnboardingFormSchema
>;

export const SendClientRequestSchema = z.object({
  approver_email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  request_message: z
    .string()
    .min(10, 'Request message must be at least 10 characters')
    .max(500, 'Request message must be less than 500 characters'),
});

export type SendClientRequestValues = z.infer<typeof SendClientRequestSchema>;
